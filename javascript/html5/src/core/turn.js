/**
 * Turn manages a single player turn
 *
 * @class Turn
 * Handles: card play, capture selection, discard
 * Requirement: FR-3 (Turn structure)
 */

export class Turn {
  constructor(player, tableCards) {
    this.player = player;
    this.tableCards = tableCards;
    this.cardPlayed = null;
    this.captureSet = null;
  }

  /**
   * Play a card from hand
   * @param {Card} card
   * @returns {Turn}
   */
  playCard(card) {
    const newTurn = new Turn(this.player, this.tableCards);
    newTurn.cardPlayed = card;
    return newTurn;
  }

  /**
   * Select cards to capture
   * @param {Card[]} cards
   * @returns {Turn}
   */
  selectCapture(cards) {
    const newTurn = new Turn(this.player, this.tableCards);
    newTurn.cardPlayed = this.cardPlayed;
    newTurn.captureSet = cards;
    return newTurn;
  }

  /**
   * Discard without capture
   * @returns {Turn}
   */
  discard() {
    const newTurn = new Turn(this.player, this.tableCards);
    newTurn.cardPlayed = this.cardPlayed;
    newTurn.captureSet = [];
    return newTurn;
  }
}
