/**
 * Card represents a single playing card in the Baraja Española deck
 *
 * @class Card
 * @typedef {Object} Card
 * @property {string} suit - Suit: "oros", "copas", "espadas", "bastos"
 * @property {string} rank - Rank key: "as", "2", "3", "4", "5", "6", "7", "sota", "caballo", "rey"
 * @property {number} value - Card value: 1 (as), 2-7 (face value), 8 (sota), 9 (caballo), 10 (rey)
 *
 * Immutable card implementation following frozen dataclass pattern.
 */

export class Card {
  constructor(suit, rank, value) {
    this.suit = suit;
    this.rank = rank;
    this.value = value;
    Object.freeze(this);
  }

  /**
   * Get display name for card
   * @returns {string} e.g. "As of Oros", "7 of Espadas"
   */
  get displayName() {
    const rankMap = {
      as: "As",
      sota: "Sota",
      caballo: "Caballo",
      rey: "Rey",
    };
    const rankName = rankMap[this.rank] || this.rank;
    return `${rankName} of ${this.suit}`;
  }

  /**
   * Compare two cards for equality
   * @param {Card} other
   * @returns {boolean}
   */
  equals(other) {
    return this.suit === other.suit && this.rank === other.rank;
  }

  /**
   * String representation
   * @returns {string}
   */
  toString() {
    return this.displayName;
  }
}
