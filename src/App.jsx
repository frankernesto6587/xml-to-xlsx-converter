import { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import ThemeToggle from './components/ThemeToggle';
import PanelSettings from './components/PanelSettings';
import DuplicatesAlert from './components/DuplicatesAlert';
import ExportPanel from './components/ExportPanel';
import AdvancedFilters from './components/AdvancedFilters';
import ChartsPanel from './components/ChartsPanel';
import AdvancedSummary from './components/AdvancedSummary';
import TransactionModal from './components/TransactionModal';
import { parseXML, detectCurrencyType } from './utils/xmlParser';
import { getSummary } from './utils/xlsxGenerator';
import { extractXMLFromZip, isZipFile } from './utils/zipHandler';
import { saveToHistory, getPreferences, savePreferences } from './utils/localStorage';

function App() {
  const [data, setData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [filesProcessed, setFilesProcessed] = useState(0);
  const [sequenceValidation, setSequenceValidation] = useState(null);
  const [currencyType, setCurrencyType] = useState(null); // { tipo: 'MLC'|'MN', moneda: 'USD'|'CUP' }

  // Pagination and filter
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState(null);
  const [channels, setChannels] = useState([]);

  // Panel preferences
  const [panelPreferences, setPanelPreferences] = useState({
    duplicates: true,
    export: true,
    charts: true,
    advancedSummary: true,
    filters: true,
    table: true
  });

  // Transaction modal
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Load panel preferences on mount
  useEffect(() => {
    const prefs = getPreferences();
    if (prefs.panels) {
      setPanelPreferences(prefs.panels);
    }
  }, []);

  const handleFileSelect = async (files) => {
    setProcessing(true);
    setError(null);

    try {
      // Convert to array if single file
      const filesArray = Array.isArray(files) ? files : [files];
      const multipleFiles = filesArray.length > 1;

      // Detect and validate currency type
      const detectedTypes = filesArray.map(f => detectCurrencyType(f.name));
      const uniqueTypes = [...new Set(detectedTypes.map(t => t.tipo).filter(Boolean))];

      if (uniqueTypes.length > 1) {
        setError('No se pueden procesar archivos MLC (USD) y MN (CUP) juntos. Por favor, suba solo archivos de un tipo de moneda.');
        setProcessing(false);
        return;
      }

      if (uniqueTypes.length === 1) {
        setCurrencyType(detectedTypes.find(t => t.tipo));
      } else {
        setCurrencyType(null);
      }

      // Process each file
      const allParsedData = [];

      for (const file of filesArray) {
        let xmlContent;
        let actualFileName = file.name;

        // Check if file is ZIP
        const isZip = await isZipFile(file);

        if (isZip) {
          // Extract XML from ZIP
          const extracted = await extractXMLFromZip(file);
          xmlContent = extracted.content;
          actualFileName = extracted.fileName;

          // Show info if multiple XML files were found
          if (extracted.totalFiles > 1) {
            console.log(`Se encontraron ${extracted.totalFiles} archivos XML. Procesando: ${actualFileName}`);
          }
        } else {
          // Read XML file directly
          xmlContent = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Error al leer el archivo'));
            reader.readAsText(file);
          });
        }

        // Parse XML
        const parsedData = parseXML(xmlContent);
        allParsedData.push(parsedData);
      }

      // Combine all data
      let combinedData;

      if (multipleFiles) {
        // Helper function to parse dates from M/D/YYYY format
        const parseDate = (dateStr) => {
          if (!dateStr) return new Date(0);
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            const month = parseInt(parts[0], 10) - 1;
            const day = parseInt(parts[1], 10);
            const year = parseInt(parts[2], 10);
            return new Date(year, month, day);
          }
          return new Date(0);
        };

        // Collect all transactions from all files
        const allTransactions = [];
        allParsedData.forEach(parsedData => {
          allTransactions.push(...parsedData.transactions);
        });

        // Sort by date
        allTransactions.sort((a, b) => {
          return parseDate(a.fecha) - parseDate(b.fecha);
        });

        // Find file with earliest transaction date (for saldoInicial)
        let earliestFile = allParsedData[0];
        let earliestDate = new Date(9999, 11, 31);

        allParsedData.forEach(parsedData => {
          if (parsedData.transactions.length > 0) {
            const firstTransactionDate = parseDate(parsedData.transactions[0].fecha);
            if (firstTransactionDate < earliestDate) {
              earliestDate = firstTransactionDate;
              earliestFile = parsedData;
            }
          }
        });

        // Find file with latest transaction date (for saldosFinales)
        let latestFile = allParsedData[0];
        let latestDate = new Date(0);

        allParsedData.forEach(parsedData => {
          if (parsedData.transactions.length > 0) {
            const lastTransaction = parsedData.transactions[parsedData.transactions.length - 1];
            const lastTransactionDate = parseDate(lastTransaction.fecha);
            if (lastTransactionDate > latestDate) {
              latestDate = lastTransactionDate;
              latestFile = parsedData;
            }
          }
        });

        combinedData = {
          saldoInicial: earliestFile.saldoInicial,
          transactions: allTransactions,
          saldosFinales: latestFile.saldosFinales
        };

        // Validate balance concordance
        const saldoInicialNum = parseFloat(earliestFile.saldoInicial?.importe || 0);
        const saldoFinalNum = parseFloat(
          latestFile.saldosFinales.disponible?.importe ||
          latestFile.saldosFinales.contable?.importe ||
          0
        );

        let totalCredits = 0;
        let totalDebits = 0;
        allTransactions.forEach(t => {
          const amount = parseFloat(t.importe || 0);
          if (t.tipo === 'Cr' || t.tipo === 'Hb') {
            totalCredits += amount;
          } else if (t.tipo === 'Dr' || t.tipo === 'Db') {
            totalDebits += amount;
          }
        });

        const calculatedBalance = saldoInicialNum + totalCredits - totalDebits;
        const difference = Math.abs(calculatedBalance - saldoFinalNum);

        // Set sequence validation info
        const validationInfo = {
          isValid: difference <= 0.01,
          saldoInicial: saldoInicialNum,
          totalCredits,
          totalDebits,
          calculatedBalance,
          saldoFinal: saldoFinalNum,
          difference,
          earliestDate: earliestDate.toLocaleDateString('es-ES'),
          latestDate: latestDate.toLocaleDateString('es-ES')
        };

        setSequenceValidation(validationInfo);

        if (difference > 0.01) {
          console.warn(`⚠️ Discrepancia de balance detectada:`);
          console.warn(`   Saldo Inicial: $${saldoInicialNum.toFixed(2)}`);
          console.warn(`   Total Créditos: $${totalCredits.toFixed(2)}`);
          console.warn(`   Total Débitos: $${totalDebits.toFixed(2)}`);
          console.warn(`   Balance Calculado: $${calculatedBalance.toFixed(2)}`);
          console.warn(`   Saldo Final Reportado: $${saldoFinalNum.toFixed(2)}`);
          console.warn(`   Diferencia: $${difference.toFixed(2)}`);

          setError(`⚠️ Advertencia: Se detectó una discrepancia de $${difference.toFixed(2)} entre el balance calculado y el saldo final reportado. Revisa los datos en la consola.`);
        }

        setFilesProcessed(filesArray.length);
        setFileName(`${filesArray.length} archivos combinados`);
      } else {
        // Single file: use data as-is
        combinedData = allParsedData[0];
        setFilesProcessed(1);
        setFileName(filesArray[0].name);
      }

      setData(combinedData);

      // Generate summary
      const summaryData = getSummary(combinedData);
      setSummary(summaryData);

      // Extract unique channels
      const uniqueChannels = [...new Set(combinedData.transactions.map(t => t.canal).filter(Boolean))];
      setChannels(uniqueChannels);

      // Save to history
      saveToHistory(combinedData, multipleFiles ? `${filesArray.length} archivos` : filesArray[0].name, summaryData);
    } catch (err) {
      setError(err.message);
      setData(null);
      setSummary(null);
      setFilesProcessed(0);
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!data) return;

    try {
      const generatedFileName = generateXLSX(data, fileName);
      alert(`Archivo descargado: ${generatedFileName}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReset = () => {
    setData(null);
    setFileName('');
    setError(null);
    setSummary(null);
    setFilesProcessed(0);
    setSequenceValidation(null);
    setCurrencyType(null);
    setCurrentPage(1);
    setSearchTerm('');
  };

  // Filter transactions based on search term and advanced filters
  const getFilteredTransactions = () => {
    if (!data || !data.transactions) return [];

    let filtered = [...data.transactions];

    // Apply search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(transaction => {
        return (
          (transaction.fecha || '').toLowerCase().includes(search) ||
          (transaction.referencia_corriente || '').toLowerCase().includes(search) ||
          (transaction.referencia_origen || '').toLowerCase().includes(search) ||
          (transaction.canal || '').toLowerCase().includes(search) ||
          (transaction.ordenante_nombre || '').toLowerCase().includes(search) ||
          (transaction.ordenante_ci || '').toLowerCase().includes(search) ||
          (transaction.ordenante_cuenta || '').toLowerCase().includes(search) ||
          (transaction.beneficiario_cuenta || '').toLowerCase().includes(search) ||
          (transaction.concepto || '').toLowerCase().includes(search) ||
          (transaction.importe || '').toString().includes(search) ||
          (transaction.tipo || '').toLowerCase().includes(search)
        );
      });
    }

    // Apply advanced filters
    if (advancedFilters) {
      // Date range filter
      if (advancedFilters.dateFrom || advancedFilters.dateTo) {
        filtered = filtered.filter(transaction => {
          if (!transaction.fecha) return false;

          const [day, month, year] = transaction.fecha.split('/');
          const transactionDate = new Date(year, month - 1, day);

          if (advancedFilters.dateFrom) {
            const fromDate = new Date(advancedFilters.dateFrom);
            if (transactionDate < fromDate) return false;
          }

          if (advancedFilters.dateTo) {
            const toDate = new Date(advancedFilters.dateTo);
            if (transactionDate > toDate) return false;
          }

          return true;
        });
      }

      // Type filter
      if (advancedFilters.type && advancedFilters.type !== 'all') {
        if (advancedFilters.type === 'credits') {
          filtered = filtered.filter(t => t.tipo === 'Cr');
        } else if (advancedFilters.type === 'debits') {
          filtered = filtered.filter(t => t.tipo === 'Dr' || t.tipo === 'Db');
        }
      }

      // Amount range filter
      if (advancedFilters.amountMin || advancedFilters.amountMax) {
        filtered = filtered.filter(transaction => {
          const amount = parseFloat(transaction.importe) || 0;

          if (advancedFilters.amountMin && amount < parseFloat(advancedFilters.amountMin)) {
            return false;
          }

          if (advancedFilters.amountMax && amount > parseFloat(advancedFilters.amountMax)) {
            return false;
          }

          return true;
        });
      }

      // Channel filter
      if (advancedFilters.channel && advancedFilters.channel !== 'all') {
        filtered = filtered.filter(t => t.canal === advancedFilters.channel);
      }
    }

    return filtered;
  };

  // Calculate balance for transactions
  const calculateBalance = (transactions) => {
    let balance = 0;
    return transactions.map(transaction => {
      const importe = parseFloat(transaction.importe || 0);
      if (transaction.tipo === 'Cr' || transaction.tipo === 'Hb') {
        balance += importe;
      } else if (transaction.tipo === 'Dr' || transaction.tipo === 'Db') {
        balance -= importe;
      }
      return {
        ...transaction,
        balance: balance
      };
    });
  };

  // Get paginated transactions
  const getPaginatedTransactions = () => {
    const filtered = getFilteredTransactions();
    const withBalance = calculateBalance(filtered);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return withBalance.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    const filtered = getFilteredTransactions();
    return Math.ceil(filtered.length / itemsPerPage);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    // Scroll to table top
    document.getElementById('transactions-table')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleFilterChange = (filters) => {
    setAdvancedFilters(filters);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleRemoveDuplicates = (cleanedTransactions) => {
    const newData = {
      ...data,
      transactions: cleanedTransactions
    };
    setData(newData);

    // Regenerate summary with cleaned data
    const summaryData = getSummary(newData);
    setSummary(summaryData);
  };

  const handlePanelPreferencesChange = (newPreferences) => {
    setPanelPreferences(newPreferences);

    // Save to localStorage
    const prefs = getPreferences();
    savePreferences({ ...prefs, panels: newPreferences });
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      {/* Theme Toggle */}
      <ThemeToggle />

      {/* Panel Settings - only show when data is loaded */}
      {data && (
        <PanelSettings
          panelPreferences={panelPreferences}
          onPreferencesChange={handlePanelPreferencesChange}
        />
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header with MerXbit branding */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-3">
            Mer<span className="text-cyan-400">X</span>bit
          </h1>
          <p className="text-xl text-gray-300 mb-2">
            Conversor XML/ZIP a XLSX
          </p>
          <p className="text-sm text-gray-400">
            Convierte extractos bancarios de XML o ZIP a Excel
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-red-400 mt-0.5 mr-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h3 className="font-medium text-red-300">Error</h3>
                <p className="text-sm text-red-200 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* File Upload or Results */}
        {!data ? (
          <FileUpload onFileSelect={handleFileSelect} />
        ) : (
          <div className="space-y-6">
            {/* Success Card */}
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <svg
                    className="w-8 h-8 text-green-400 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      {filesProcessed > 1 ? 'Archivos procesados correctamente' : 'Archivo procesado correctamente'}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-gray-400">{fileName}</p>
                      {filesProcessed > 1 && (
                        <span className="px-2 py-0.5 bg-cyan-600 text-cyan-100 rounded-full text-xs font-medium">
                          {filesProcessed} archivos
                        </span>
                      )}
                      {currencyType && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          currencyType.tipo === 'MLC'
                            ? 'bg-green-600 text-green-100'
                            : 'bg-blue-600 text-blue-100'
                        }`}>
                          {currencyType.tipo} ({currencyType.moneda})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="text-gray-400 hover:text-gray-200 transition-colors"
                  title="Procesar otro archivo"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Balance Cards */}
              {summary && (
                <div className="space-y-6 mb-6">
                  {/* Initial Balance */}
                  <div className="bg-blue-900/30 p-5 rounded-lg border border-blue-700">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-blue-300 font-medium">
                        Saldo Inicial
                      </p>
                      {filesProcessed > 1 && (
                        <span className="px-2 py-1 bg-blue-700/50 text-blue-200 rounded text-xs font-medium">
                          Múltiples archivos (asumido: 0)
                        </span>
                      )}
                    </div>
                    <p className="text-3xl font-bold text-blue-100">
                      ${parseFloat(summary.saldoInicial).toLocaleString('es-ES', {minimumFractionDigits: 2})}
                    </p>
                  </div>

                  {/* Transaction Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                      <p className="text-sm text-gray-300 font-medium">
                        Total Transacciones
                      </p>
                      <p className="text-2xl font-bold text-white mt-1">
                        {summary.totalTransactions}
                      </p>
                    </div>
                    <div className="bg-green-900/30 p-4 rounded-lg border border-green-700">
                      <p className="text-sm text-green-300 font-medium">Créditos</p>
                      <p className="text-2xl font-bold text-green-100 mt-1">
                        {summary.credits}
                      </p>
                      <p className="text-xs text-green-200 mt-1">
                        ${parseFloat(summary.totalCredits).toLocaleString('es-ES', {minimumFractionDigits: 2})}
                      </p>
                    </div>
                    <div className="bg-red-900/30 p-4 rounded-lg border border-red-700">
                      <p className="text-sm text-red-300 font-medium">Débitos</p>
                      <p className="text-2xl font-bold text-red-100 mt-1">
                        {summary.debits}
                      </p>
                      <p className="text-xs text-red-200 mt-1">
                        ${parseFloat(summary.totalDebits).toLocaleString('es-ES', {minimumFractionDigits: 2})}
                      </p>
                    </div>
                  </div>

                  {/* Final Balance */}
                  <div className="bg-cyan-900/30 p-5 rounded-lg border border-cyan-700">
                    <p className="text-sm text-cyan-300 font-medium mb-2">
                      Saldo Disponible Final
                    </p>
                    <p className="text-3xl font-bold text-cyan-100">
                      ${parseFloat(summary.saldoFinal).toLocaleString('es-ES', {minimumFractionDigits: 2})}
                    </p>
                  </div>
                </div>
              )}

            </div>

            {/* Sequence Validation for Multiple Files */}
            {sequenceValidation && filesProcessed > 1 && (
              <div className={`p-6 rounded-lg shadow-xl border ${
                sequenceValidation.isValid
                  ? 'bg-green-900/30 border-green-700'
                  : 'bg-yellow-900/30 border-yellow-700'
              }`}>
                <div className="flex items-start">
                  {sequenceValidation.isValid ? (
                    <svg className="w-6 h-6 text-green-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                  <div className="flex-1">
                    <h3 className={`font-semibold mb-2 ${
                      sequenceValidation.isValid ? 'text-green-300' : 'text-yellow-300'
                    }`}>
                      {sequenceValidation.isValid
                        ? '✓ Validación de Secuencia: Correcta'
                        : '⚠ Validación de Secuencia: Discrepancia Detectada'}
                    </h3>
                    <div className="text-sm space-y-1 text-gray-300">
                      <p>📅 Rango de fechas: {sequenceValidation.earliestDate} → {sequenceValidation.latestDate}</p>
                      <p>💰 Saldo Inicial: ${sequenceValidation.saldoInicial.toLocaleString('es-ES', {minimumFractionDigits: 2})}</p>
                      <p>📈 Total Créditos: ${sequenceValidation.totalCredits.toLocaleString('es-ES', {minimumFractionDigits: 2})}</p>
                      <p>📉 Total Débitos: ${sequenceValidation.totalDebits.toLocaleString('es-ES', {minimumFractionDigits: 2})}</p>
                      <p className="font-medium">🧮 Balance Calculado: ${sequenceValidation.calculatedBalance.toLocaleString('es-ES', {minimumFractionDigits: 2})}</p>
                      <p className="font-medium">📊 Saldo Final Reportado: ${sequenceValidation.saldoFinal.toLocaleString('es-ES', {minimumFractionDigits: 2})}</p>
                      {!sequenceValidation.isValid && (
                        <p className="font-bold text-yellow-200 mt-2">
                          ⚠️ Diferencia: ${sequenceValidation.difference.toLocaleString('es-ES', {minimumFractionDigits: 2})}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Duplicates Alert */}
            {panelPreferences.duplicates && (
              <DuplicatesAlert
                transactions={data.transactions}
                onRemoveDuplicates={handleRemoveDuplicates}
              />
            )}

            {/* Export Panel */}
            {panelPreferences.export && (
              <ExportPanel data={data} fileName={fileName} />
            )}

            {/* Advanced Filters */}
            {panelPreferences.filters && (
              <AdvancedFilters
                onFilterChange={handleFilterChange}
                channels={channels}
              />
            )}

            {/* Transactions Table with Search and Pagination */}
            {panelPreferences.table && (
            <div id="transactions-table" className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">
                  Todas las transacciones ({getFilteredTransactions().length})
                </h3>
              </div>

              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar por fecha, referencias, ordenante, beneficiario, importe, concepto..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full px-4 py-3 pl-11 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                  <svg
                    className="absolute left-3 top-3.5 w-5 h-5 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Ref. Corriente
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Ref. Origen
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Canal
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Ordenante
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Beneficiario
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Concepto
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Débito
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Crédito
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Balance
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Observaciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {getPaginatedTransactions().map((transaction, index) => (
                      <tr
                        key={index}
                        onClick={() => setSelectedTransaction(transaction)}
                        className="hover:bg-gray-700 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3 text-sm text-gray-200 whitespace-nowrap">
                          {transaction.fecha}
                        </td>
                        <td className="px-4 py-3 text-sm text-cyan-300 font-mono">
                          {transaction.referencia_corriente}
                        </td>
                        <td className="px-4 py-3 text-sm text-cyan-300 font-mono">
                          {transaction.referencia_origen}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-200">
                          {transaction.canal}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-200">
                          {transaction.ordenante_nombre}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-200">
                          {transaction.beneficiario_cuenta}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300 max-w-xs truncate">
                          {transaction.concepto}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-right whitespace-nowrap text-red-300">
                          {(transaction.tipo === 'Dr' || transaction.tipo === 'Db')
                            ? `$${parseFloat(transaction.importe).toLocaleString('es-ES', {minimumFractionDigits: 2})}`
                            : ''}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-right whitespace-nowrap text-green-300">
                          {(transaction.tipo === 'Cr' || transaction.tipo === 'Hb')
                            ? `$${parseFloat(transaction.importe).toLocaleString('es-ES', {minimumFractionDigits: 2})}`
                            : ''}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-right whitespace-nowrap text-cyan-300">
                          ${transaction.balance.toLocaleString('es-ES', {minimumFractionDigits: 2})}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 font-mono max-w-md">
                          <div className="truncate" title={transaction.observacion_completa || 'N/A'}>
                            {transaction.observacion_completa || 'N/A'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {getTotalPages() > 1 && (
                <div className="mt-6 flex items-center justify-between border-t border-gray-700 pt-4">
                  <div className="text-sm text-gray-400">
                    Página {currentPage} de {getTotalPages()} • Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, getFilteredTransactions().length)} de {getFilteredTransactions().length} transacciones
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Primera página"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Página anterior"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    {/* Page Numbers */}
                    {(() => {
                      const totalPages = getTotalPages();
                      const pages = [];
                      let startPage = Math.max(1, currentPage - 2);
                      let endPage = Math.min(totalPages, currentPage + 2);

                      if (currentPage <= 3) {
                        endPage = Math.min(5, totalPages);
                      }
                      if (currentPage >= totalPages - 2) {
                        startPage = Math.max(1, totalPages - 4);
                      }

                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <button
                            key={i}
                            onClick={() => handlePageChange(i)}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                              i === currentPage
                                ? 'bg-cyan-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            {i}
                          </button>
                        );
                      }
                      return pages;
                    })()}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === getTotalPages()}
                      className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Página siguiente"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handlePageChange(getTotalPages())}
                      disabled={currentPage === getTotalPages()}
                      className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Última página"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
            )}

            {/* Charts */}
            {panelPreferences.charts && (
              <ChartsPanel data={data} summary={summary} />
            )}

            {/* Advanced Summary */}
            {panelPreferences.advancedSummary && (
              <AdvancedSummary data={data} />
            )}
          </div>
        )}

        {/* Processing Indicator */}
        {processing && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 flex items-center border border-gray-700">
              <svg
                className="animate-spin h-8 w-8 text-cyan-400 mr-3"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span className="text-white font-medium">
                Procesando archivo...
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-gray-400">
          <p>🔒 Todos los datos se procesan localmente en tu navegador</p>
          <p className="mt-1">No se envía información a ningún servidor</p>
        </div>
      </div>

      {/* Transaction Modal */}
      {selectedTransaction && (
        <TransactionModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </div>
  );
}

export default App;
