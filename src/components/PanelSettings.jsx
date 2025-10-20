import { useState } from 'react';

export default function PanelSettings({ panelPreferences, onPreferencesChange }) {
  const [showSettings, setShowSettings] = useState(false);

  const panels = [
    { key: 'duplicates', label: 'Alerta de Duplicados', icon: '⚠️' },
    { key: 'export', label: 'Panel de Exportación', icon: '📥' },
    { key: 'charts', label: 'Gráficos Estadísticos', icon: '📊' },
    { key: 'advancedSummary', label: 'Análisis Avanzado', icon: '📈' },
    { key: 'filters', label: 'Filtros Avanzados', icon: '🔍' },
    { key: 'table', label: 'Tabla de Transacciones', icon: '📋' }
  ];

  const togglePanel = (panelKey) => {
    const newPreferences = {
      ...panelPreferences,
      [panelKey]: !panelPreferences[panelKey]
    };
    onPreferencesChange(newPreferences);
  };

  const activeCount = Object.values(panelPreferences).filter(v => v).length;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Settings Button */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="bg-cyan-600 hover:bg-cyan-500 text-white p-4 rounded-full shadow-lg transition-all hover:scale-110"
        title="Configurar paneles"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      </button>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute bottom-16 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-4 w-80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold">Configurar Paneles</h3>
              <p className="text-xs text-gray-400">{activeCount} de {panels.length} activos</p>
            </div>
            <button
              onClick={() => setShowSettings(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {panels.map(panel => (
              <label
                key={panel.key}
                className="flex items-center justify-between p-3 bg-gray-900 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{panel.icon}</span>
                  <span className="text-sm text-gray-200">{panel.label}</span>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={panelPreferences[panel.key]}
                    onChange={() => togglePanel(panel.key)}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${
                    panelPreferences[panel.key] ? 'bg-cyan-600' : 'bg-gray-600'
                  }`}>
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform transform ${
                      panelPreferences[panel.key] ? 'translate-x-6' : 'translate-x-0.5'
                    } mt-0.5`}></div>
                  </div>
                </div>
              </label>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-400 text-center">
              Las preferencias se guardan automáticamente
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
