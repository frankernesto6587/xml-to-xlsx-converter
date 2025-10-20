import { parseISO, format, parse } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Get top transactions by amount
 * @param {Array} transactions - Array of transaction objects
 * @param {number} limit - Number of top transactions to return
 * @param {string} type - 'credits' or 'debits'
 * @returns {Array} Top transactions
 */
export function getTopTransactions(transactions, limit = 10, type = 'all') {
  let filtered = transactions;

  if (type === 'credits') {
    filtered = transactions.filter(t => t.tipo === 'Cr');
  } else if (type === 'debits') {
    filtered = transactions.filter(t => t.tipo === 'Dr' || t.tipo === 'Db');
  }

  return filtered
    .map(t => ({ ...t, importeNumerico: parseFloat(t.importe) || 0 }))
    .sort((a, b) => b.importeNumerico - a.importeNumerico)
    .slice(0, limit);
}

/**
 * Calculate daily average
 * @param {Array} transactions - Array of transaction objects
 * @param {string} type - 'credits', 'debits', or 'all'
 * @returns {number} Daily average
 */
export function getDailyAverage(transactions, type = 'all') {
  let filtered = transactions;

  if (type === 'credits') {
    filtered = transactions.filter(t => t.tipo === 'Cr');
  } else if (type === 'debits') {
    filtered = transactions.filter(t => t.tipo === 'Dr' || t.tipo === 'Db');
  }

  // Get unique dates
  const dates = new Set(filtered.map(t => t.fecha).filter(Boolean));
  const totalDays = dates.size || 1;

  const total = filtered.reduce((sum, t) => sum + (parseFloat(t.importe) || 0), 0);

  return total / totalDays;
}

/**
 * Get transactions by channel
 * @param {Array} transactions - Array of transaction objects
 * @returns {Object} Transactions grouped by channel
 */
export function getTransactionsByChannel(transactions) {
  const byChannel = {};

  transactions.forEach(transaction => {
    const channel = transaction.canal || 'Sin canal';
    if (!byChannel[channel]) {
      byChannel[channel] = {
        count: 0,
        total: 0,
        transactions: []
      };
    }

    byChannel[channel].count++;
    byChannel[channel].total += parseFloat(transaction.importe) || 0;
    byChannel[channel].transactions.push(transaction);
  });

  return byChannel;
}

/**
 * Get transactions by date (grouped)
 * @param {Array} transactions - Array of transaction objects
 * @returns {Object} Transactions grouped by date
 */
export function getTransactionsByDate(transactions) {
  const byDate = {};

  transactions.forEach(transaction => {
    const fecha = transaction.fecha || 'Sin fecha';
    if (!byDate[fecha]) {
      byDate[fecha] = {
        count: 0,
        credits: 0,
        debits: 0,
        transactions: []
      };
    }

    const amount = parseFloat(transaction.importe) || 0;
    byDate[fecha].count++;

    if (transaction.tipo === 'Cr') {
      byDate[fecha].credits += amount;
    } else if (transaction.tipo === 'Dr' || transaction.tipo === 'Db') {
      byDate[fecha].debits += amount;
    }

    byDate[fecha].transactions.push(transaction);
  });

  return byDate;
}

/**
 * Get highest and lowest transactions
 * @param {Array} transactions - Array of transaction objects
 * @returns {Object} Highest and lowest transactions
 */
export function getExtremeTransactions(transactions) {
  if (!transactions || transactions.length === 0) {
    return { highest: null, lowest: null };
  }

  const withAmounts = transactions.map(t => ({
    ...t,
    importeNumerico: parseFloat(t.importe) || 0
  }));

  const highest = withAmounts.reduce((max, t) =>
    t.importeNumerico > max.importeNumerico ? t : max
  );

  const lowest = withAmounts.reduce((min, t) =>
    t.importeNumerico < min.importeNumerico ? t : min
  );

  return { highest, lowest };
}

/**
 * Calculate balance over time
 * @param {Array} transactions - Array of transaction objects (sorted by date)
 * @param {number} initialBalance - Initial balance
 * @returns {Array} Array of {date, balance} objects
 */
export function calculateBalanceOverTime(transactions, initialBalance = 0) {
  const balanceHistory = [];
  let currentBalance = initialBalance;

  // Sort transactions by date
  const sorted = [...transactions].sort((a, b) => {
    const parseDate = (dateStr) => {
      if (!dateStr) return new Date(0);
      const [day, month, year] = dateStr.split('/');
      return new Date(year, month - 1, day);
    };
    return parseDate(a.fecha) - parseDate(b.fecha);
  });

  sorted.forEach(transaction => {
    const amount = parseFloat(transaction.importe) || 0;

    if (transaction.tipo === 'Cr') {
      currentBalance += amount;
    } else if (transaction.tipo === 'Dr' || transaction.tipo === 'Db') {
      currentBalance -= amount;
    }

    balanceHistory.push({
      fecha: transaction.fecha,
      balance: currentBalance,
      transaction
    });
  });

  return balanceHistory;
}

/**
 * Compare two periods
 * @param {Array} period1Transactions - Transactions from period 1
 * @param {Array} period2Transactions - Transactions from period 2
 * @returns {Object} Comparison data
 */
export function comparePeriods(period1Transactions, period2Transactions) {
  const calcStats = (transactions) => {
    const credits = transactions.filter(t => t.tipo === 'Cr');
    const debits = transactions.filter(t => t.tipo === 'Dr' || t.tipo === 'Db');

    const totalCredits = credits.reduce((sum, t) => sum + (parseFloat(t.importe) || 0), 0);
    const totalDebits = debits.reduce((sum, t) => sum + (parseFloat(t.importe) || 0), 0);

    return {
      totalTransactions: transactions.length,
      totalCredits,
      totalDebits,
      netBalance: totalCredits - totalDebits
    };
  };

  const period1Stats = calcStats(period1Transactions);
  const period2Stats = calcStats(period2Transactions);

  return {
    period1: period1Stats,
    period2: period2Stats,
    difference: {
      transactions: period2Stats.totalTransactions - period1Stats.totalTransactions,
      credits: period2Stats.totalCredits - period1Stats.totalCredits,
      debits: period2Stats.totalDebits - period1Stats.totalDebits,
      netBalance: period2Stats.netBalance - period1Stats.netBalance
    },
    percentageChange: {
      transactions: period1Stats.totalTransactions > 0
        ? ((period2Stats.totalTransactions - period1Stats.totalTransactions) / period1Stats.totalTransactions * 100)
        : 0,
      credits: period1Stats.totalCredits > 0
        ? ((period2Stats.totalCredits - period1Stats.totalCredits) / period1Stats.totalCredits * 100)
        : 0,
      debits: period1Stats.totalDebits > 0
        ? ((period2Stats.totalDebits - period1Stats.totalDebits) / period1Stats.totalDebits * 100)
        : 0
    }
  };
}
