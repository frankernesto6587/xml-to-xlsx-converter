import { useState } from 'react';
import { detectDuplicates, removeDuplicates } from '../utils/duplicateDetector';

export default function DuplicatesAlert({ transactions, onRemoveDuplicates }) {
  const [showDetails, setShowDetails] = useState(false);
  const duplicates = detectDuplicates(transactions);

  if (duplicates.length === 0) {
    return null;
  }

  const handleRemove = () => {
    const cleaned = removeDuplicates(transactions, duplicates);
    onRemoveDuplicates(cleaned);
  };

  return (
    <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
      <div className="flex items-start">
        <svg className="w-6 h-6 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div className="flex-1">
          <h4 className="font-medium text-yellow-300 mb-2">
            ⚠️ {duplicates.length} transaccion{duplicates.length > 1 ? 'es' : ''} duplicada{duplicates.length > 1 ? 's' : ''} detectada{duplicates.length > 1 ? 's' : ''}
          </h4>
          <p className="text-sm text-yellow-200 mb-3">
            Se detectaron transacciones con la misma fecha, importe y referencia.
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-3 py-1.5 bg-yellow-700 hover:bg-yellow-600 text-yellow-100 rounded text-sm font-medium transition-colors"
            >
              {showDetails ? 'Ocultar detalles' : 'Ver detalles'}
            </button>
            <button
              onClick={handleRemove}
              className="px-3 py-1.5 bg-red-700 hover:bg-red-600 text-red-100 rounded text-sm font-medium transition-colors"
            >
              Eliminar duplicados
            </button>
          </div>

          {showDetails && (
            <div className="mt-4 bg-gray-900 rounded-lg p-3 max-h-60 overflow-y-auto">
              <h5 className="text-xs font-medium text-gray-400 mb-2">Transacciones duplicadas:</h5>
              <div className="space-y-2">
                {duplicates.map((dup, idx) => (
                  <div key={idx} className="text-xs text-gray-300 border-b border-gray-700 pb-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{dup.transaction.fecha}</span>
                      <span className="text-yellow-300">${parseFloat(dup.transaction.importe).toFixed(2)}</span>
                    </div>
                    <div className="text-gray-400 truncate">
                      Ref: {dup.transaction.referencia_corriente}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
