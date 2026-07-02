/**
 * Test suite for Deck module
 * Tests: deck creation, shuffling, drawing cards
 * Requirement: FR-1.1, FR-1.2 (Deck composition and dealing)
 */

import { describe, expect, it } from "vitest";
import { Deck } from "../core/deck.js";

describe("Deck", () => {
  it("should create a complete 40-card deck", () => {
    const deck = new Deck();
    expect(deck.cards).toHaveLength(40);
  });

  it("should have 10 cards per suit", () => {
    const deck = new Deck();
    const suits = ["oros", "copas", "espadas", "bastos"];
    for (const suit of suits) {
      const suitCards = deck.cards.filter((card) => card.suit === suit);
      expect(suitCards).toHaveLength(10);
    }
  });

  it("should shuffle deck and produce different order", () => {
    const deck = new Deck();
    const original = deck.cards.map((c) => c.displayName).join(",");
    const shuffled = deck.shuffle();
    const shuffledStr = shuffled.cards.map((c) => c.displayName).join(",");
    expect(shuffledStr).not.toBe(original);
  });

  it("should draw n cards from deck", () => {
    const deck = new Deck();
    const { drawn, remaining } = deck.draw(5);
    expect(drawn).toHaveLength(5);
    expect(remaining.remaining).toBe(35);
  });

  it("should indicate when deck is empty", () => {
    const deck = new Deck([]);
    expect(deck.isEmpty).toBe(true);
  });

  it("should have correct card values", () => {
    const deck = new Deck();
    const as = deck.cards.find((c) => c.rank === "as");
    expect(as.value).toBe(1);

    const rey = deck.cards.find((c) => c.rank === "rey");
    expect(rey.value).toBe(10);
  });
});
