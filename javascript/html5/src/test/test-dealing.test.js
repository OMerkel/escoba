/**
 * Test suite for Dealing module
 * Tests: initial deal, re-deal, final card award
 * Requirement: FR-2, FR-7, FR-10 (Dealing mechanics)
 */

import { describe, expect, it } from "vitest";
import { DealingEngine } from "../core/dealing.js";
import { Deck } from "../core/deck.js";

describe("DealingEngine", () => {
  it("should execute initial deal correctly", () => {
    const deck = new Deck().shuffle();
    const result = DealingEngine.initialDeal(deck);

    expect(result.p1Hand).toHaveLength(3);
    expect(result.p2Hand).toHaveLength(3);
    expect(result.tableCards).toHaveLength(4);
    expect(result.remainingDeck.remaining).toBe(30);
  });

  it("should handle re-deal", () => {
    const deck = new Deck([]);
    for (let i = 0; i < 30; i++) {
      deck.cards.push(new (require("../core/card.js").Card)("oros", "as", 1));
    }

    const result = DealingEngine.reDeal(deck);
    expect(result.p1Hand).toHaveLength(3);
    expect(result.p2Hand).toHaveLength(3);
    expect(result.remainingDeck.remaining).toBe(24);
  });

  it("should award final table cards to last capturer", () => {
    const player = { name: "Player 1", pile: [] };
    const tableCards = [new (require("../core/card.js").Card)("oros", "2", 2)];

    const updated = DealingEngine.awardFinalCards(tableCards, player);
    expect(updated.pile).toHaveLength(1);
  });
});
