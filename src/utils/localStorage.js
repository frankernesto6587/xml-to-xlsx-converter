const HISTORY_KEY = 'merxbit_history';
const MAX_HISTORY_ITEMS = 10;

/**
 * Save processing result to history
 * @param {Object} data - Processed data
 * @param {string} fileName - File name
 * @param {Object} summary - Summary statistics
 */
export function saveToHistory(data, fileName, summary) {
  try {
    const history = getHistory();

    const historyItem = {
      id: Date.now(),
      fileName,
      processedAt: new Date().toISOString(),
      summary: {
        totalTransactions: summary.totalTransactions,
        credits: summary.credits,
        debits: summary.debits,
        totalCredits: summary.totalCredits,
        totalDebits: summary.totalDebits,
        saldoInicial: summary.saldoInicial,
        saldoFinal: summary.saldoFinal
      },
      // Store only a preview of transactions to save space
      transactionsPreview: data.transactions.slice(0, 10)
    };

    // Add to beginning of history
    history.unshift(historyItem);

    // Keep only MAX_HISTORY_ITEMS
    const trimmedHistory = history.slice(0, MAX_HISTORY_ITEMS);

    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmedHistory));
  } catch (error) {
    console.error('Error al guardar en historial:', error);
  }
}

/**
 * Get history from localStorage
 * @returns {Array} Array of history items
 */
export function getHistory() {
  try {
    const history = localStorage.getItem(HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Error al leer historial:', error);
    return [];
  }
}

/**
 * Clear all history
 */
export function clearHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error('Error al limpiar historial:', error);
  }
}

/**
 * Delete specific history item
 * @param {number} id - History item id
 */
export function deleteHistoryItem(id) {
  try {
    const history = getHistory();
    const filtered = history.filter(item => item.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error al eliminar item del historial:', error);
  }
}

/**
 * Save user preferences
 * @param {Object} preferences - User preferences object
 */
export function savePreferences(preferences) {
  try {
    localStorage.setItem('merxbit_preferences', JSON.stringify(preferences));
  } catch (error) {
    console.error('Error al guardar preferencias:', error);
  }
}

/**
 * Get user preferences
 * @returns {Object} User preferences
 */
export function getPreferences() {
  try {
    const prefs = localStorage.getItem('merxbit_preferences');
    return prefs ? JSON.parse(prefs) : getDefaultPreferences();
  } catch (error) {
    console.error('Error al leer preferencias:', error);
    return getDefaultPreferences();
  }
}

/**
 * Get default preferences
 * @returns {Object} Default preferences
 */
function getDefaultPreferences() {
  return {
    theme: 'dark',
    itemsPerPage: 10,
    defaultExportFormat: 'xlsx',
    showDuplicateWarning: true,
    selectedColumns: [
      'fecha', 'referencia_corriente', 'referencia_origen', 'canal',
      'ordenante_nombre', 'beneficiario_cuenta', 'concepto', 'importe', 'tipo'
    ],
    panels: {
      duplicates: true,
      export: true,
      charts: true,
      advancedSummary: true,
      filters: true,
      table: true
    }
  };
}
