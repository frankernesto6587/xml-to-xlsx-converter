import * as XLSX from 'xlsx';

/**
 * Generate XLSX file from structured bank statement data
 * @param {Object} data - Structured data with saldoInicial, transactions, saldosFinales
 * @param {string} originalFileName - Original XML filename
 */
export function generateXLSX(data, originalFileName) {
  try {
    const workbook = XLSX.utils.book_new();

    // Create main transactions sheet
    const transactionsSheet = createTransactionsSheet(data);
    XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Transacciones');

    // Create summary sheet
    const summarySheet = createSummarySheet(data);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

    // Generate filename - handle various cases
    let xlsxFileName;
    if (originalFileName.toLowerCase().endsWith('.xml')) {
      xlsxFileName = originalFileName.replace(/\.xml$/i, '.xlsx');
    } else if (originalFileName.toLowerCase().endsWith('.zip')) {
      xlsxFileName = originalFileName.replace(/\.zip$/i, '.xlsx');
    } else {
      // For combined files or other cases
      xlsxFileName = `extracto_${new Date().getTime()}.xlsx`;
    }

    // Write and download the file with options to enable tables
    XLSX.writeFile(workbook, xlsxFileName, {
      bookType: 'xlsx',
      bookSST: false,
      type: 'binary',
      cellStyles: true
    });

    return xlsxFileName;
  } catch (error) {
    console.error('Error al generar el archivo XLSX:', error);
    throw new Error(`Error al generar el archivo Excel: ${error.message}`);
  }
}

/**
 * Convert date string to Excel date object
 * @param {string} dateStr - Date in M/D/YYYY format
 * @returns {Date|string} Date object or original string
 */
function parseToExcelDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') {
    return '';
  }

  // Parse M/D/YYYY format
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const month = parseInt(parts[0], 10) - 1; // JavaScript months are 0-indexed
    const day = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    // Create Date object - Excel will recognize this as a date
    const date = new Date(year, month, day);

    // Verify the date is valid
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  return dateStr; // Return original if parsing fails
}

/**
 * Create transactions worksheet
 */
function createTransactionsSheet(data) {
  const saldoInicialImporte = parseFloat(data.saldoInicial?.importe || 0);
  const saldoInicialTipo = data.saldoInicial?.tipo || '';

  // Add header with initial balance - use empty date for balance row
  const headerData = [
    {
      'Fecha': '',
      'Tipo Registro': 'SALDO INICIAL',
      'Ref. Corriente': '',
      'Ref. Origen': '',
      'Canal': '',
      'Ordenante': '',
      'CI Ordenante': '',
      'Cuenta Ordenante': '',
      'Tarjeta': '',
      'Cuenta Beneficiario': '',
      'Concepto': '',
      'Débito': (saldoInicialTipo === 'Dr' || saldoInicialTipo === 'Db') ? saldoInicialImporte : 0,
      'Crédito': (saldoInicialTipo === 'Cr' || saldoInicialTipo === 'Hb') ? saldoInicialImporte : 0,
      'Balance': saldoInicialImporte,
      'Observaciones': ''
    },
    {
      'Fecha': '',
      'Tipo Registro': '',
      'Ref. Corriente': '',
      'Ref. Origen': '',
      'Canal': '',
      'Ordenante': '',
      'CI Ordenante': '',
      'Cuenta Ordenante': '',
      'Tarjeta': '',
      'Cuenta Beneficiario': '',
      'Concepto': '',
      'Débito': 0,
      'Crédito': 0,
      'Balance': '',
      'Observaciones': ''
    },
  ];

  // Process transactions WITHOUT pre-calculating balance (will use formulas)
  const transactionsData = data.transactions.map(transaction => {
    const importe = parseFloat(transaction.importe || 0);

    return {
      'Fecha': parseToExcelDate(transaction.fecha),
      'Tipo Registro': 'TRANSACCIÓN',
      'Ref. Corriente': transaction.referencia_corriente || '',
      'Ref. Origen': transaction.referencia_origen || '',
      'Canal': transaction.canal || '',
      'Ordenante': transaction.ordenante_nombre || '',
      'CI Ordenante': transaction.ordenante_ci || '',
      'Cuenta Ordenante': transaction.ordenante_cuenta || '',
      'Tarjeta': transaction.ordenante_tarjeta || '',
      'Cuenta Beneficiario': transaction.beneficiario_cuenta || '',
      'Concepto': transaction.concepto || '',
      'Débito': (transaction.tipo === 'Dr' || transaction.tipo === 'Db') ? importe : 0,
      'Crédito': (transaction.tipo === 'Cr' || transaction.tipo === 'Hb') ? importe : 0,
      'Balance': '',  // Will be replaced with formulas
      'Observaciones': transaction.observacion_completa || '',
    };
  });

  // Combine header and transactions
  const excelData = [...headerData, ...transactionsData];

  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Add balance formulas (column N is Balance, column L is Débito, column M is Crédito)
  // Row 2 (index 1): Initial balance - keep as value
  // Row 3 (index 2): Empty row - no formula
  // Row 4 (index 3): First transaction - Formula =N2+M4-L4 (initial balance + credit - debit)
  // Row 5+ (index 4+): Formula =N4+M5-L5 (previous balance + credit - debit)
  for (let i = 3; i < excelData.length; i++) {
    const rowNum = i + 1; // Excel row number (1-indexed)

    // For first transaction, reference row 2 (initial balance)
    // For subsequent transactions, reference previous row
    const prevRowNum = i === 3 ? 2 : rowNum - 1;

    // Balance formula: =Previous_Balance + Credit - Debit
    worksheet[`N${rowNum}`] = {
      f: `N${prevRowNum}+M${rowNum}-L${rowNum}`,
      t: 'n'
    };
  }

  // Apply date format to Fecha column (column A)
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  for (let row = range.s.r + 1; row <= range.e.r; row++) {
    const cellAddress = `A${row + 1}`;
    if (worksheet[cellAddress] && worksheet[cellAddress].t === 'd') {
      worksheet[cellAddress].z = 'm/d/yyyy';
    }
  }

  // Set column widths
  worksheet['!cols'] = [
    { wch: 12 },  // Fecha
    { wch: 18 },  // Tipo Registro
    { wch: 18 },  // Ref. Corriente
    { wch: 18 },  // Ref. Origen
    { wch: 20 },  // Canal
    { wch: 30 },  // Ordenante
    { wch: 15 },  // CI
    { wch: 20 },  // Cuenta Ordenante
    { wch: 20 },  // Tarjeta
    { wch: 20 },  // Cuenta Beneficiario
    { wch: 50 },  // Concepto
    { wch: 15 },  // Débito
    { wch: 15 },  // Crédito
    { wch: 15 },  // Balance
    { wch: 80 },  // Observaciones
  ];

  // Add Excel Table with formatting
  const totalRows = excelData.length;

  // Add autofilter
  worksheet['!autofilter'] = { ref: `A1:O${totalRows}` };

  // Add table definition
  worksheet['!tables'] = [{
    name: 'TablaTransacciones',
    displayName: 'TablaTransacciones',
    ref: `A1:O${totalRows}`,
    headerRow: true,
    totalsRow: false,
    style: {
      theme: 'TableStyleMedium2',
      showFirstColumn: false,
      showLastColumn: false,
      showRowStripes: true,
      showColumnStripes: false
    },
    columns: [
      { name: 'Fecha' },
      { name: 'Tipo Registro', totalsRowLabel: 'Total:' },
      { name: 'Ref. Corriente' },
      { name: 'Ref. Origen' },
      { name: 'Canal' },
      { name: 'Ordenante' },
      { name: 'CI Ordenante' },
      { name: 'Cuenta Ordenante' },
      { name: 'Tarjeta' },
      { name: 'Cuenta Beneficiario' },
      { name: 'Concepto' },
      { name: 'Débito', totalsRowFunction: 'sum' },
      { name: 'Crédito', totalsRowFunction: 'sum' },
      { name: 'Balance' },
      { name: 'Observaciones' }
    ]
  }];

  return worksheet;
}

/**
 * Create summary worksheet
 */
function createSummarySheet(data) {
  const summaryData = [
    { 'Concepto': 'SALDO INICIAL', 'Importe': data.saldoInicial?.importe || '0.00', 'Tipo': data.saldoInicial?.tipo || '' },
    { 'Concepto': '', 'Importe': '', 'Tipo': '' },
    { 'Concepto': '--- TRANSACCIONES ---', 'Importe': data.transactions.length, 'Tipo': 'Total' },
    { 'Concepto': '', 'Importe': '', 'Tipo': '' },
    { 'Concepto': 'SALDO CONTABLE FINAL', 'Importe': data.saldosFinales.contable?.importe || '0.00', 'Tipo': data.saldosFinales.contable?.tipo || '' },
    { 'Concepto': 'SALDO RESERVADO', 'Importe': data.saldosFinales.reservado?.importe || '0.00', 'Tipo': data.saldosFinales.reservado?.tipo || '' },
    { 'Concepto': 'SALDO SOBRE GIRO', 'Importe': data.saldosFinales.sobreGiro?.importe || '0.00', 'Tipo': data.saldosFinales.sobreGiro?.tipo || '' },
    { 'Concepto': 'SALDO DISPONIBLE FINAL', 'Importe': data.saldosFinales.disponible?.importe || '0.00', 'Tipo': data.saldosFinales.disponible?.tipo || '' },
  ];

  const worksheet = XLSX.utils.json_to_sheet(summaryData);

  worksheet['!cols'] = [
    { wch: 30 },
    { wch: 20 },
    { wch: 10 },
  ];

  // Add Excel Table with formatting
  const totalRows = summaryData.length;

  // Add autofilter
  worksheet['!autofilter'] = { ref: `A1:C${totalRows}` };

  // Add table definition
  worksheet['!tables'] = [{
    name: 'TablaResumen',
    displayName: 'TablaResumen',
    ref: `A1:C${totalRows}`,
    headerRow: true,
    totalsRow: false,
    style: {
      theme: 'TableStyleMedium2',
      showFirstColumn: false,
      showLastColumn: false,
      showRowStripes: true,
      showColumnStripes: false
    },
    columns: [
      { name: 'Concepto' },
      { name: 'Importe' },
      { name: 'Tipo' }
    ]
  }];

  return worksheet;
}

/**
 * Preview data before download (returns array of objects for display)
 * @param {Array} transactions - Array of transaction objects
 * @param {number} limit - Number of rows to preview (default 10)
 * @returns {Array} Limited array of transactions
 */
export function previewData(transactions, limit = 10) {
  return transactions.slice(0, limit);
}

/**
 * Get summary statistics from structured data
 * @param {Object} data - Structured data with transactions and balances
 * @returns {Object} Summary statistics
 */
export function getSummary(data) {
  let credits = 0;
  let debits = 0;
  let totalCredits = 0;
  let totalDebits = 0;

  data.transactions.forEach(transaction => {
    const amount = parseFloat(transaction.importe) || 0;
    const type = (transaction.tipo || '').trim().toLowerCase();

    if (type === 'cr') {
      credits++;
      totalCredits += amount;
    } else if (type === 'dr' || type === 'db') {
      debits++;
      totalDebits += amount;
    } else {
      // Debug: registrar tipos desconocidos
      console.log('Tipo de transacción desconocido:', transaction.tipo, 'para la transacción:', transaction);
    }
  });

  return {
    saldoInicial: data.saldoInicial?.importe || '0.00',
    totalTransactions: data.transactions.length,
    credits,
    debits,
    totalCredits: totalCredits.toFixed(2),
    totalDebits: totalDebits.toFixed(2),
    saldoFinal: data.saldosFinales.disponible?.importe || data.saldosFinales.contable?.importe || '0.00',
  };
}
