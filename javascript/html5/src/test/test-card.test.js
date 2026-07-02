/**
 * Test suite for Card module
 * Tests: card creation, equality, display
 * Requirement: FR-1.1 (Deck composition - individual cards)
 */

import { describe, expect, it } from "vitest";
import { Card } from "../core/card.js";

describe("Card", () => {
  it("should create a card with suit, rank, and value", () => {
    const card = new Card("oros", "as", 1);
    expect(card.suit).toBe("oros");
    expect(card.rank).toBe("as");
    expect(card.value).toBe(1);
  });

  it("should be immutable (frozen)", () => {
    const card = new Card("oros", "as", 1);
    expect(() => {
      card.value = 2;
    }).toThrow();
  });

  it("should have correct display name", () => {
    const card = new Card("oros", "as", 1);
    expect(card.displayName).toBe("As of oros");
  });

  it("should compare cards for equality", () => {
    const card1 = new Card("oros", "as", 1);
    const card2 = new Card("oros", "as", 1);
    const card3 = new Card("copas", "as", 1);
    expect(card1.equals(card2)).toBe(true);
    expect(card1.equals(card3)).toBe(false);
  });

  it("should have proper string representation", () => {
    const card = new Card("espadas", "7", 7);
    expect(card.toString()).toBe("7 of espadas");
  });
});
