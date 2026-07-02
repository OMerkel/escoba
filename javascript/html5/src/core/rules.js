/**
 * RulesEngine enforces game rules.
 * Handles: forced capture, special initial conditions, configuration rules
 * Requirement: FR-4.3, FR-10, FR-11 (Game rules enforcement)
 */
export const RulesEngine = {
  /**
   * Enforce forced capture rule
   * If capture possible, must capture (cannot discard)
   * @param {Card} playedCard
   * @param {Card[]} tableCards
   * @returns {boolean} True if capture is forced
   */
  isCaptureForced(playedCard, tableCards) {
    // If any capture exists, it is forced
    const { CaptureEngine } = require("./capture.js");
    return CaptureEngine.hasCapture(playedCard, tableCards);
  },

  /**
   * Check special initial condition
   * Table sum of 15 or 30 allows automatic capture
   * @param {Card[]} tableCards
   * @returns {boolean}
   */
  hasSpecialInitialCondition(tableCards) {
    const sum = tableCards.reduce((acc, card) => acc + card.value, 0);
    return sum === 15 || sum === 30;
  },

  /**
   * Validate move against rules
   * @param {Card} playedCard
   * @param {Card[]} tableCards
   * @param {Card[]} selectedCapture
   * @returns {Object} {valid: boolean, reason?: string}
   */
  validateMove(playedCard, tableCards, selectedCapture) {
    // If no capture selected, check if forced
    if (!selectedCapture || selectedCapture.length === 0) {
      const captureForced = RulesEngine.isCaptureForced(playedCard, tableCards);
      if (captureForced) {
        return {
          valid: false,
          reason: "Capture is forced when available",
        };
      }
      return { valid: true };
    }

    // Capture selected: validate sum
    const sum = selectedCapture.reduce((acc, card) => acc + card.value, 0);
    if (sum !== playedCard.value) {
      return {
        valid: false,
        reason: "Capture sum must equal card value",
      };
    }

    return { valid: true };
  },
};
