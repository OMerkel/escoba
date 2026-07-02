/**
 * DealingEngine manages card distribution.
 * Handles: initial deal (3-4-3), re-deal mechanics, final card award
 * Requirement: FR-2, FR-7, FR-10 (Dealing and special conditions)
 */
export const DealingEngine = {
  /**
   * Execute initial deal: 3 cards to each player, 4 to table
   * @param {Deck} deck
   * @returns {Object} {p1Hand, p2Hand, tableCards, remainingDeck}
   */
  initialDeal(deck) {
    let remaining = deck;

    // Draw for player 1
    const { drawn: p1Hand, remaining: r1 } = remaining.draw(3);
    remaining = r1;

    // Draw for table
    const { drawn: tableCards, remaining: r2 } = remaining.draw(4);
    remaining = r2;

    // Draw for player 2
    const { drawn: p2Hand, remaining: r3 } = remaining.draw(3);
    remaining = r3;

    return {
      p1Hand,
      p2Hand,
      tableCards,
      remainingDeck: remaining,
    };
  },

  /**
   * Execute re-deal: 3 more cards to each player (when hands empty)
   * @param {Deck} deck
   * @returns {Object} {p1Hand, p2Hand, remainingDeck}
   */
  reDeal(deck) {
    let remaining = deck;

    const { drawn: p1Hand, remaining: r1 } = remaining.draw(3);
    remaining = r1;

    const { drawn: p2Hand, remaining: r2 } = remaining.draw(3);
    remaining = r2;

    return {
      p1Hand,
      p2Hand,
      remainingDeck: remaining,
    };
  },

  /**
   * Award remaining table cards to last capturer
   * @param {Card[]} tableCards
   * @param {Object} lastCapturer
   * @returns {Object} Updated capturer with cards added to pile
   */
  awardFinalCards(tableCards, lastCapturer) {
    return {
      ...lastCapturer,
      pile: [...lastCapturer.pile, ...tableCards],
    };
  },
};
