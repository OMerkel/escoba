/**
 * CaptureEngine validates and executes capture moves.
 * Handles: capture validation, single-complement preference, forced capture
 * Requirement: FR-4, FR-5 (Capture mechanics)
 */
export const CaptureEngine = {
  /**
   * Get all valid capture combinations from table for card
   * Escoba de Quince rule: hand card + table cards must sum to exactly 15
   * @param {Card} playedCard
   * @param {Card[]} tableCards
   * @returns {Card[][]} Array of valid capture sets
   */
  getValidCaptures(playedCard, tableCards) {
    const target = 15; // Escoba de Quince target
    const handCardValue = playedCard.value;
    const validCaptures = [];

    // Generate all subsets of table cards
    const subsets = CaptureEngine._generateSubsets(tableCards);

    // Filter for those where (hand card + table sum) equals 15
    for (const subset of subsets) {
      const sum = subset.reduce((acc, card) => acc + card.value, 0);
      if (handCardValue + sum === target) {
        validCaptures.push(subset);
      }
    }

    return validCaptures;
  },

  /**
   * Check if capture is available
   * @param {Card} playedCard
   * @param {Card[]} tableCards
   * @returns {boolean}
   */
  hasCapture(playedCard, tableCards) {
    return CaptureEngine.getValidCaptures(playedCard, tableCards).length > 0;
  },

  /**
   * Enforce single-complement preference
   * If both 1-card and multi-card captures available, return only 1-card
   * @param {Card[][]} captures
   * @returns {Card[][]}
   */
  applySingleComplementPreference(captures) {
    const singleCard = captures.filter((c) => c.length === 1);
    if (singleCard.length > 0) {
      return singleCard;
    }
    return captures;
  },

  /**
   * Generate all subsets of array
   * @private
   * @param {Array} arr
   * @returns {Array[]}
   */
  _generateSubsets(arr) {
    const subsets = [];
    for (let i = 0; i < 2 ** arr.length; i++) {
      const subset = [];
      for (let j = 0; j < arr.length; j++) {
        if (i & (1 << j)) {
          subset.push(arr[j]);
        }
      }
      if (subset.length > 0) {
        subsets.push(subset);
      }
    }
    return subsets;
  },
};
