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

    // Write and download the file
    XLSX.writeFile(workbook, xlsxFileName);

    return xlsxFileName;
  } catch (error) {
    console.error('Error al generar el archivo XLSX:', error);
    throw new Error(`Error al generar el archivo Excel: ${error.message}`);
  }
}

/**
 * Create transactions worksheet
 */
function createTransactionsSheet(data) {
  // Add header with initial balance
  const headerData = [
    { 'Fecha': 'SALDO INICIAL', 'Ref. Corriente': '', 'Ref. Origen': '', 'Canal': '', 'Ordenante': '', 'CI Ordenante': '', 'Cuenta Ordenante': '', 'Tarjeta': '', 'Cuenta Beneficiario': '', 'Concepto': '', 'Importe': parseFloat(data.saldoInicial?.importe || 0), 'Tipo': data.saldoInicial?.tipo || '' },
    { 'Fecha': '', 'Ref. Corriente': '', 'Ref. Origen': '', 'Canal': '', 'Ordenante': '', 'CI Ordenante': '', 'Cuenta Ordenante': '', 'Tarjeta': '', 'Cuenta Beneficiario': '', 'Concepto': '', 'Importe': '', 'Tipo': '' },
  ];

  // Process transactions with negative amounts for debits
  const transactionsData = data.transactions.map(transaction => {
    const importe = parseFloat(transaction.importe || 0);
    const importeConSigno = (transaction.tipo === 'Dr' || transaction.tipo === 'Db') ? -importe : importe;

    return {
      'Fecha': transaction.fecha || '',
      'Ref. Corriente': transaction.referencia_corriente || '',
      'Ref. Origen': transaction.referencia_origen || '',
      'Canal': transaction.canal || '',
      'Ordenante': transaction.ordenante_nombre || '',
      'CI Ordenante': transaction.ordenante_ci || '',
      'Cuenta Ordenante': transaction.ordenante_cuenta || '',
      'Tarjeta': transaction.ordenante_tarjeta || '',
      'Cuenta Beneficiario': transaction.beneficiario_cuenta || '',
      'Concepto': transaction.concepto || '',
      'Importe': importeConSigno,
      'Tipo': transaction.tipo || '',
    };
  });

  // Combine header and transactions
  const excelData = [...headerData, ...transactionsData];

  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 12 },  // Fecha
    { wch: 18 },  // Ref. Corriente
    { wch: 18 },  // Ref. Origen
    { wch: 20 },  // Canal
    { wch: 30 },  // Ordenante
    { wch: 15 },  // CI
    { wch: 20 },  // Cuenta Ordenante
    { wch: 20 },  // Tarjeta
    { wch: 20 },  // Cuenta Beneficiario
    { wch: 50 },  // Concepto
    { wch: 15 },  // Importe
    { wch: 8 },   // Tipo
  ];

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
    saldoFinal: data.saldosFinales.disponible?.importe || '0.00',
  };
}
