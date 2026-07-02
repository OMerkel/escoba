/**
 * Test suite for EscobaEngine module
 * Tests: escoba detection, award mechanics
 * Requirement: FR-6 (Escoba detection and scoring)
 */

import { describe, expect, it } from "vitest";
import { Card } from "../core/card.js";
import { EscobaEngine } from "../core/escoba.js";

describe("EscobaEngine", () => {
  it("should detect escoba when table is cleared", () => {
    const playedCard = new Card("oros", "7", 7);
    const tableCards = [new Card("copas", "7", 7)];
    const captureSet = tableCards;

    const isEscoba = EscobaEngine.isEscoba(playedCard, tableCards, captureSet);
    expect(isEscoba).toBe(true);
  });

  it("should not detect escoba when table partially captured", () => {
    const playedCard = new Card("oros", "5", 5);
    const tableCards = [
      new Card("copas", "2", 2),
      new Card("espadas", "3", 3),
      new Card("bastos", "4", 4),
    ];
    const captureSet = [new Card("copas", "2", 2), new Card("espadas", "3", 3)];

    const isEscoba = EscobaEngine.isEscoba(playedCard, tableCards, captureSet);
    expect(isEscoba).toBe(false);
  });

  it("should award escoba to player", () => {
    const player = { name: "Player 1", escobas: 0 };
    const updated = EscobaEngine.awardEscoba(player);
    expect(updated.escobas).toBe(1);
  });
});
