export default function TransactionModal({ transaction, onClose }) {
  if (!transaction) return null;

  const fields = [
    { key: 'fecha', label: 'Fecha' },
    { key: 'referencia_corriente', label: 'Referencia Corriente' },
    { key: 'referencia_origen', label: 'Referencia Origen' },
    { key: 'canal', label: 'Canal' },
    { key: 'ordenante_nombre', label: 'Nombre Ordenante' },
    { key: 'ordenante_ci', label: 'CI Ordenante' },
    { key: 'ordenante_cuenta', label: 'Cuenta Ordenante' },
    { key: 'ordenante_tarjeta', label: 'Tarjeta Ordenante' },
    { key: 'beneficiario_cuenta', label: 'Cuenta Beneficiario' },
    { key: 'concepto', label: 'Concepto' },
    { key: 'importe', label: 'Importe' },
    { key: 'tipo', label: 'Tipo' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Detalles de Transacción</h2>
            <p className="text-sm text-gray-400 mt-1">
              {transaction.fecha} - Ref: {transaction.referencia_corriente}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
            title="Cerrar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Amount Badge */}
          <div className="mb-6 flex items-center justify-center">
            <div className={`px-6 py-4 rounded-lg ${
              transaction.tipo === 'Cr' || transaction.tipo === 'Hb'
                ? 'bg-green-900/30 border border-green-700'
                : 'bg-red-900/30 border border-red-700'
            }`}>
              <div className="text-center">
                <div className="text-sm text-gray-400 mb-1">Importe</div>
                <div className={`text-3xl font-bold ${
                  transaction.tipo === 'Cr' || transaction.tipo === 'Hb'
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}>
                  {transaction.tipo === 'Dr' || transaction.tipo === 'Db' ? '-' : ''}
                  ${parseFloat(transaction.importe || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  {transaction.tipo === 'Cr' || transaction.tipo === 'Hb' ? 'Crédito' : 'Débito'}
                </div>
              </div>
            </div>
          </div>

          {/* Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map(field => {
              const value = transaction[field.key];
              if (!value || value === '' || value === 'N/A') return null;

              return (
                <div key={field.key} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                    {field.label}
                  </div>
                  <div className="text-white font-medium break-words">
                    {field.key === 'importe' ? (
                      `$${parseFloat(value || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    ) : field.key === 'tipo' ? (
                      <span className={`px-2 py-1 rounded text-xs ${
                        value === 'Cr' || value === 'Hb'
                          ? 'bg-green-900/50 text-green-300'
                          : 'bg-red-900/50 text-red-300'
                      }`}>
                        {value}
                      </span>
                    ) : (
                      value
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Observaciones - Technical Data */}
          {transaction.observacion_completa && transaction.observacion_completa !== 'N/A' && (
            <div className="mt-6">
              <div className="bg-gray-900 rounded-lg p-4 border border-cyan-700/50">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-cyan-400 uppercase tracking-wider font-semibold">
                    Observaciones Técnicas
                  </div>
                </div>
                <div className="bg-black/50 p-4 rounded border border-gray-800 overflow-x-auto">
                  <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap break-words">
                    {transaction.observacion_completa}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Full Data JSON */}
          <div className="mt-6">
            <details className="bg-gray-900 rounded-lg border border-gray-700">
              <summary className="cursor-pointer p-4 text-sm text-cyan-400 hover:text-cyan-300 font-medium">
                Ver datos completos (JSON)
              </summary>
              <div className="p-4 pt-0">
                <pre className="text-xs text-gray-300 overflow-x-auto bg-black/50 p-4 rounded border border-gray-800">
                  {JSON.stringify(transaction, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
