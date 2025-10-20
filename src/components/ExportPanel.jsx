import { useState } from 'react';
import { generateXLSX } from '../utils/xlsxGenerator';
import { exportToCSV, exportToPDF, exportToJSON } from '../utils/exporters';

export default function ExportPanel({ data, fileName }) {
  const [showConfig, setShowConfig] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState([
    'fecha', 'referencia_corriente', 'referencia_origen', 'canal',
    'ordenante_nombre', 'beneficiario_cuenta', 'concepto', 'importe', 'tipo'
  ]);

  const allColumns = [
    { key: 'fecha', label: 'Fecha' },
    { key: 'referencia_corriente', label: 'Ref. Corriente' },
    { key: 'referencia_origen', label: 'Ref. Origen' },
    { key: 'canal', label: 'Canal' },
    { key: 'ordenante_nombre', label: 'Ordenante' },
    { key: 'ordenante_ci', label: 'CI Ordenante' },
    { key: 'ordenante_cuenta', label: 'Cuenta Ordenante' },
    { key: 'ordenante_tarjeta', label: 'Tarjeta' },
    { key: 'beneficiario_cuenta', label: 'Cuenta Beneficiario' },
    { key: 'concepto', label: 'Concepto' },
    { key: 'importe', label: 'Importe' },
    { key: 'tipo', label: 'Tipo' }
  ];

  const toggleColumn = (columnKey) => {
    if (selectedColumns.includes(columnKey)) {
      setSelectedColumns(selectedColumns.filter(k => k !== columnKey));
    } else {
      setSelectedColumns([...selectedColumns, columnKey]);
    }
  };

  const handleExport = (format) => {
    try {
      // Generate base filename - handle multiple files or archives
      let baseFileName;
      if (fileName.toLowerCase().endsWith('.xml') || fileName.toLowerCase().endsWith('.zip')) {
        baseFileName = fileName.replace(/\.(xml|zip)$/i, '');
      } else {
        // For combined files or other cases
        baseFileName = `extracto_${new Date().getTime()}`;
      }

      switch(format) {
        case 'xlsx':
          generateXLSX(data, fileName);
          break;
        case 'csv':
          exportToCSV(data, `${baseFileName}.csv`, selectedColumns);
          break;
        case 'json':
          exportToJSON(data, `${baseFileName}.json`);
          break;
        default:
          console.error('Formato no soportado:', format);
      }
    } catch (error) {
      console.error('Error al exportar:', error);
      alert(`Error al exportar: ${error.message}`);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4">📥 Exportar Datos</h3>

      {/* Main Export Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        <button
          onClick={() => handleExport('xlsx')}
          className="flex flex-col items-center justify-center p-4 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
        >
          <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-sm font-medium">XLSX</span>
        </button>

        <button
          onClick={() => handleExport('csv')}
          className="flex flex-col items-center justify-center p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
        >
          <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-sm font-medium">CSV</span>
        </button>

        <button
          onClick={() => handleExport('json')}
          className="flex flex-col items-center justify-center p-4 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
        >
          <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          <span className="text-sm font-medium">JSON</span>
        </button>
      </div>

      {/* Column Configuration */}
      <div className="border-t border-gray-700 pt-4">
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-medium flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Configurar columnas para CSV
          {showConfig ? ' ▲' : ' ▼'}
        </button>

        {showConfig && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
            {allColumns.map(column => (
              <label key={column.key} className="flex items-center space-x-2 text-sm text-gray-300 cursor-pointer hover:bg-gray-700 p-2 rounded">
                <input
                  type="checkbox"
                  checked={selectedColumns.includes(column.key)}
                  onChange={() => toggleColumn(column.key)}
                  className="rounded border-gray-600 text-cyan-600 focus:ring-cyan-500"
                />
                <span>{column.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
