import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

/**
 * Export transactions to CSV
 * @param {Object} data - Structured data with transactions
 * @param {string} fileName - Name for the file
 * @param {Array} selectedColumns - Array of column keys to include
 */
export function exportToCSV(data, fileName = 'extracto.csv', selectedColumns = null) {
  const columns = selectedColumns || [
    'fecha', 'referencia_corriente', 'referencia_origen', 'canal',
    'ordenante_nombre', 'ordenante_ci', 'ordenante_cuenta', 'ordenante_tarjeta',
    'beneficiario_cuenta', 'concepto', 'debito', 'credito', 'balance', 'observacion_completa'
  ];

  const columnHeaders = {
    fecha: 'Fecha',
    referencia_corriente: 'Ref. Corriente',
    referencia_origen: 'Ref. Origen',
    canal: 'Canal',
    ordenante_nombre: 'Ordenante',
    ordenante_ci: 'CI Ordenante',
    ordenante_cuenta: 'Cuenta Ordenante',
    ordenante_tarjeta: 'Tarjeta',
    beneficiario_cuenta: 'Cuenta Beneficiario',
    concepto: 'Concepto',
    debito: 'Débito',
    credito: 'Crédito',
    balance: 'Balance',
    observacion_completa: 'Observaciones'
  };

  // Create header row
  const headers = columns.map(col => columnHeaders[col] || col);
  const csvRows = [headers.join(',')];

  // Calculate balance
  const saldoInicial = parseFloat(data.saldoInicial?.importe || 0);
  let balance = saldoInicial;

  // Add data rows
  data.transactions.forEach(transaction => {
    const importe = parseFloat(transaction.importe || 0);

    // Calculate balance
    if (transaction.tipo === 'Cr' || transaction.tipo === 'Hb') {
      balance += importe;
    } else if (transaction.tipo === 'Dr' || transaction.tipo === 'Db') {
      balance -= importe;
    }

    const row = columns.map(col => {
      let value = '';

      // Handle special cases
      if (col === 'debito') {
        value = (transaction.tipo === 'Dr' || transaction.tipo === 'Db') ? importe.toFixed(2) : '';
      } else if (col === 'credito') {
        value = (transaction.tipo === 'Cr' || transaction.tipo === 'Hb') ? importe.toFixed(2) : '';
      } else if (col === 'balance') {
        value = balance.toFixed(2);
      } else {
        value = transaction[col] || '';
      }

      // Escape commas, quotes, and newlines in values for CSV
      if (typeof value === 'string') {
        const needsEscaping = value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r');

        // Replace newlines with spaces for better CSV compatibility
        value = value.replace(/\r?\n/g, ' ');

        // Wrap in quotes if needed and escape internal quotes
        if (needsEscaping) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
      }

      return value;
    });
    csvRows.push(row.join(','));
  });

  // Create blob and download
  const csvContent = csvRows.join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export transactions to JSON
 * @param {Object} data - Structured data with transactions
 * @param {string} fileName - Name for the file
 */
export function exportToJSON(data, fileName = 'extracto.json') {
  // Calculate balance and add computed fields
  const saldoInicial = parseFloat(data.saldoInicial?.importe || 0);
  let balance = saldoInicial;

  const enrichedTransactions = data.transactions.map(transaction => {
    const importe = parseFloat(transaction.importe || 0);

    // Calculate balance
    if (transaction.tipo === 'Cr' || transaction.tipo === 'Hb') {
      balance += importe;
    } else if (transaction.tipo === 'Dr' || transaction.tipo === 'Db') {
      balance -= importe;
    }

    return {
      ...transaction,
      debito: (transaction.tipo === 'Dr' || transaction.tipo === 'Db') ? importe : 0,
      credito: (transaction.tipo === 'Cr' || transaction.tipo === 'Hb') ? importe : 0,
      balance: balance
    };
  });

  const enrichedData = {
    ...data,
    transactions: enrichedTransactions
  };

  const jsonData = JSON.stringify(enrichedData, null, 2);
  const blob = new Blob([jsonData], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export transactions to PDF
 * @param {Object} data - Structured data with transactions
 * @param {string} fileName - Name for the file
 * @param {Object} options - PDF generation options
 */
export function exportToPDF(data, fileName = 'extracto.pdf', options = {}) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Add title
  doc.setFontSize(18);
  doc.text('Extracto Bancario - MerXbit', 14, 15);

  // Add summary info
  doc.setFontSize(10);
  doc.text(`Saldo Inicial: $${parseFloat(data.saldoInicial?.importe || 0).toLocaleString('es-ES', {minimumFractionDigits: 2})}`, 14, 25);
  doc.text(`Total Transacciones: ${data.transactions.length}`, 14, 30);

  if (data.saldosFinales?.disponible) {
    doc.text(`Saldo Final: $${parseFloat(data.saldosFinales.disponible.importe || 0).toLocaleString('es-ES', {minimumFractionDigits: 2})}`, 14, 35);
  }

  // Prepare table data
  const tableHeaders = [
    'Fecha', 'Ref. Corriente', 'Canal', 'Ordenante',
    'Beneficiario', 'Concepto', 'Importe', 'Tipo'
  ];

  const tableData = data.transactions.map(transaction => {
    const amount = parseFloat(transaction.importe) || 0;
    const sign = (transaction.tipo === 'Dr' || transaction.tipo === 'Db') ? '-' : '';

    return [
      transaction.fecha || '',
      transaction.referencia_corriente || '',
      transaction.canal || '',
      transaction.ordenante_nombre || '',
      transaction.beneficiario_cuenta || '',
      (transaction.concepto || '').substring(0, 30), // Truncate for space
      sign + amount.toFixed(2),
      transaction.tipo || ''
    ];
  });

  // Add table - Check if autoTable exists
  if (typeof doc.autoTable === 'function') {
    doc.autoTable({
    head: [tableHeaders],
    body: tableData,
    startY: 40,
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [6, 182, 212] }, // cyan color
    columnStyles: {
      5: { cellWidth: 40 }, // Concepto column wider
      6: { halign: 'right' } // Importe aligned right
    },
    didParseCell: function(data) {
      // Color debits in red
      if (data.column.index === 6 && data.cell.text[0] && data.cell.text[0].startsWith('-')) {
        data.cell.styles.textColor = [220, 38, 38];
      }
      // Color credits in green
      if (data.column.index === 6 && data.cell.text[0] && !data.cell.text[0].startsWith('-')) {
        data.cell.styles.textColor = [34, 197, 94];
      }
    }
    });
  } else {
    // Fallback if autoTable is not available
    doc.setFontSize(12);
    doc.text('Error: Plugin autoTable no está disponible', 14, 50);
    console.error('jspdf-autotable no está correctamente cargado');
  }

  // Add footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save
  doc.save(fileName);
}
