/**
 * Detect duplicate transactions
 * @param {Array} transactions - Array of transaction objects
 * @returns {Array} Array of duplicate transaction indices
 */
export function detectDuplicates(transactions) {
  const duplicates = [];
  const seen = new Map();

  transactions.forEach((transaction, index) => {
    // Create a unique key based on date, amount, and reference
    const key = `${transaction.fecha}_${transaction.importe}_${transaction.referencia_corriente}`;

    if (seen.has(key)) {
      duplicates.push({
        index,
        originalIndex: seen.get(key),
        transaction
      });
    } else {
      seen.set(key, index);
    }
  });

  return duplicates;
}

/**
 * Remove duplicates from transactions array
 * @param {Array} transactions - Array of transaction objects
 * @param {Array} duplicateIndices - Array of indices to remove
 * @returns {Array} Array without duplicates
 */
export function removeDuplicates(transactions, duplicateIndices) {
  const indicesToRemove = new Set(duplicateIndices.map(d => d.index));
  return transactions.filter((_, index) => !indicesToRemove.has(index));
}

/**
 * Mark duplicates in transactions array
 * @param {Array} transactions - Array of transaction objects
 * @returns {Array} Array with isDuplicate flag
 */
export function markDuplicates(transactions) {
  const duplicates = detectDuplicates(transactions);
  const duplicateIndices = new Set(duplicates.map(d => d.index));

  return transactions.map((transaction, index) => ({
    ...transaction,
    isDuplicate: duplicateIndices.has(index)
  }));
}
