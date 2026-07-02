/**
 * EscobaEngine detects and tracks escoba (sweep) events.
 * Escoba = capture that clears entire table (1 point)
 * Requirement: FR-6 (Escoba detection and scoring)
 */
export const EscobaEngine = {
  /**
   * Detect if move results in escoba
   * @param {Card} playedCard
   * @param {Card[]} tableCards
   * @param {Card[]} captureSet
   * @returns {boolean}
   */
  isEscoba(playedCard, tableCards, captureSet) {
    void playedCard;
    // Table is cleared if all table cards are captured
    const tableClearedCount = captureSet.length;
    const totalTableCards = tableCards.length;
    return tableClearedCount === totalTableCards;
  },

  /**
   * Award escoba point to player
   * @param {Object} player
   * @returns {Object} Updated player with escoba count incremented
   */
  awardEscoba(player) {
    return {
      ...player,
      escobas: (player.escobas || 0) + 1,
    };
  },

  /**
   * Check if any player has escobas in their pile
   * @param {Card[]} pile
   * @returns {boolean}
   */
  hasEscobas(pile) {
    void pile;
    // Placeholder: escobas may be tracked separately or in pile metadata
    return false;
  },
};
