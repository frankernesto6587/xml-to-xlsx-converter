import { getTopTransactions, getDailyAverage, getTransactionsByChannel, getExtremeTransactions } from '../utils/advancedAnalysis';

export default function AdvancedSummary({ data }) {
  const top10 = getTopTransactions(data.transactions, 10);
  const dailyAvgDebits = getDailyAverage(data.transactions, 'debits');
  const byChannel = getTransactionsByChannel(data.transactions);
  const { highest, lowest } = getExtremeTransactions(data.transactions);

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
      <h3 className="text-xl font-semibold text-white mb-6">📈 Análisis Avanzado</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Extremes */}
        <div className="bg-gray-900 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-300 mb-3">💰 Transacciones Extremas</h4>
          {highest && (
            <div className="mb-3 p-2 bg-green-900/30 rounded border border-green-700">
              <div className="text-xs text-green-300 mb-1">Mayor transacción</div>
              <div className="text-lg font-bold text-green-100">
                ${parseFloat(highest.importe).toLocaleString('es-ES', {minimumFractionDigits: 2})}
              </div>
              <div className="text-xs text-gray-400 mt-1">{highest.fecha} - {highest.concepto?.substring(0, 30)}</div>
            </div>
          )}
          {lowest && (
            <div className="p-2 bg-red-900/30 rounded border border-red-700">
              <div className="text-xs text-red-300 mb-1">Menor transacción</div>
              <div className="text-lg font-bold text-red-100">
                ${parseFloat(lowest.importe).toLocaleString('es-ES', {minimumFractionDigits: 2})}
              </div>
              <div className="text-xs text-gray-400 mt-1">{lowest.fecha} - {lowest.concepto?.substring(0, 30)}</div>
            </div>
          )}
        </div>

        {/* Daily Average */}
        <div className="bg-gray-900 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-300 mb-3">📊 Promedios Diarios</h4>
          <div className="space-y-3">
            <div className="p-2 bg-blue-900/30 rounded border border-blue-700">
              <div className="text-xs text-blue-300">Promedio de débitos por día</div>
              <div className="text-xl font-bold text-blue-100">
                ${dailyAvgDebits.toLocaleString('es-ES', {minimumFractionDigits: 2})}
              </div>
            </div>
            <div className="p-2 bg-purple-900/30 rounded border border-purple-700">
              <div className="text-xs text-purple-300">Promedio de créditos por día</div>
              <div className="text-xl font-bold text-purple-100">
                ${getDailyAverage(data.transactions, 'credits').toLocaleString('es-ES', {minimumFractionDigits: 2})}
              </div>
            </div>
          </div>
        </div>

        {/* By Channel */}
        <div className="bg-gray-900 p-4 rounded-lg md:col-span-2">
          <h4 className="text-sm font-medium text-gray-300 mb-3">🏦 Transacciones por Canal</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Object.entries(byChannel).map(([channel, info]) => (
              <div key={channel} className="p-3 bg-gray-800 rounded border border-gray-600">
                <div className="text-xs text-gray-400 mb-1">{channel}</div>
                <div className="text-lg font-bold text-white">{info.count} trans.</div>
                <div className="text-sm text-cyan-300">
                  ${info.total.toLocaleString('es-ES', {minimumFractionDigits: 2})}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top 10 */}
        <div className="bg-gray-900 p-4 rounded-lg md:col-span-2">
          <h4 className="text-sm font-medium text-gray-300 mb-3">🔝 Top 10 Transacciones Mayores</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {top10.map((transaction, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-gray-800 rounded border border-gray-600 hover:border-cyan-600 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-cyan-600 text-white text-xs font-bold rounded-full">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {transaction.concepto || 'Sin concepto'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {transaction.fecha} • {transaction.canal}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-lg font-bold text-cyan-300">
                    ${transaction.importeNumerico.toLocaleString('es-ES', {minimumFractionDigits: 2})}
                  </div>
                  <div className={`text-xs ${transaction.tipo === 'Cr' ? 'text-green-400' : 'text-red-400'}`}>
                    {transaction.tipo === 'Cr' ? 'Crédito' : 'Débito'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
