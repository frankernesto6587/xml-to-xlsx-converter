import { useState } from 'react';
import FileUpload from './components/FileUpload';
import { parseXML } from './utils/xmlParser';
import { generateXLSX, previewData, getSummary } from './utils/xlsxGenerator';

function App() {
  const [data, setData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleFileSelect = async (xmlContent, filename) => {
    setProcessing(true);
    setError(null);

    try {
      // Parse XML
      const parsedData = parseXML(xmlContent);
      setData(parsedData);
      setFileName(filename);

      // Generate summary
      const summaryData = getSummary(parsedData);
      setSummary(summaryData);
    } catch (err) {
      setError(err.message);
      setData(null);
      setSummary(null);
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
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with MerXbit branding */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-3">
            Mer<span className="text-cyan-400">X</span>bit
          </h1>
          <p className="text-xl text-gray-300 mb-2">
            Conversor XML a XLSX
          </p>
          <p className="text-sm text-gray-400">
            Convierte extractos bancarios de XML a Excel
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
                      Archivo procesado correctamente
                    </h2>
                    <p className="text-sm text-gray-400">{fileName}</p>
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
                    <p className="text-sm text-blue-300 font-medium mb-2">
                      Saldo Inicial
                    </p>
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

              {/* Download Button */}
              <button
                onClick={handleDownload}
                className="w-full bg-cyan-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-cyan-500 transition-colors flex items-center justify-center shadow-lg"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Descargar archivo XLSX
              </button>
            </div>

            {/* Preview Table */}
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">
                Vista previa de transacciones (primeras 10)
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Fecha
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Importe
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Tipo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {previewData(data.transactions).map((transaction, index) => (
                      <tr key={index} className="hover:bg-gray-700 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-200 whitespace-nowrap">
                          {transaction.fecha}
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
                        <td className="px-4 py-3 text-sm text-gray-100 font-medium">
                          ${parseFloat(transaction.importe).toLocaleString('es-ES', {minimumFractionDigits: 2})}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              transaction.tipo === 'Cr'
                                ? 'bg-green-900/50 text-green-300 border border-green-700'
                                : 'bg-red-900/50 text-red-300 border border-red-700'
                            }`}
                          >
                            {transaction.tipo}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
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
    </div>
  );
}

export default App;
