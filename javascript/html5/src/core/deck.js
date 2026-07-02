/**
 * Deck represents the 40-card Baraja Española deck
 *
 * @class Deck
 * Manages deck creation, shuffling, and dealing mechanics.
 * Implements Fisher-Yates shuffle for randomization.
 */

import { Card } from "./card.js";

const SUITS = ["oros", "copas", "espadas", "bastos"];
const RANKS = [
  { key: "as", value: 1 },
  { key: "2", value: 2 },
  { key: "3", value: 3 },
  { key: "4", value: 4 },
  { key: "5", value: 5 },
  { key: "6", value: 6 },
  { key: "7", value: 7 },
  { key: "sota", value: 8 },
  { key: "caballo", value: 9 },
  { key: "rey", value: 10 },
];

export class Deck {
  constructor(cards = null) {
    this.cards = cards || this._createDeck();
  }

  /**
   * Create a complete 40-card Baraja Española deck
   * @private
   * @returns {Card[]}
   */
  _createDeck() {
    const deck = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push(new Card(suit, rank.key, rank.value));
      }
    }
    return deck;
  }

  /**
   * Shuffle deck using Fisher-Yates algorithm
   * @returns {Deck} New shuffled deck instance
   */
  shuffle() {
    const shuffled = [...this.cards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return new Deck(shuffled);
  }

  /**
   * Draw n cards from top of deck
   * @param {number} n
   * @returns {Object} {drawn: Card[], remaining: Deck}
   */
  draw(n) {
    const drawn = this.cards.slice(0, n);
    const remaining = new Deck(this.cards.slice(n));
    return { drawn, remaining };
  }

  /**
   * Get number of cards remaining
   * @returns {number}
   */
  get remaining() {
    return this.cards.length;
  }

  /**
   * Check if deck is empty
   * @returns {boolean}
   */
  get isEmpty() {
    return this.cards.length === 0;
  }
}
