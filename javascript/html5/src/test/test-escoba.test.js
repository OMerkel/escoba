/**
 * Test suite for EscobaEngine module
 * Tests: escoba detection, award mechanics
 * Requirement: FR-6 (Escoba detection and scoring)
 */

import { describe, expect, it } from "vitest";
import { Card } from "../core/card.js";
import {
  EscobaEngine,
  isScoringEscoba,
  isTableSweep,
} from "../core/escoba.js";

describe("EscobaEngine", () => {
  it("should detect escoba when table is cleared", () => {
    // Given: a capture set that removes every table card
    const playedCard = new Card("oros", "7", 7);
    const tableCards = [new Card("copas", "7", 7)];
    const captureSet = tableCards;

    // When: escoba detection is evaluated
    const isEscoba = EscobaEngine.isEscoba(playedCard, tableCards, captureSet);

    // Then: the capture is recognized as a table-clearing sweep
    expect(isEscoba).toBe(true);
  });

  it("should not detect escoba when table partially captured", () => {
    // Given: a capture set that leaves table cards behind
    const playedCard = new Card("oros", "5", 5);
    const tableCards = [
      new Card("copas", "2", 2),
      new Card("espadas", "3", 3),
      new Card("bastos", "4", 4),
    ];
    const captureSet = [new Card("copas", "2", 2), new Card("espadas", "3", 3)];

    // When: escoba detection is evaluated
    const isEscoba = EscobaEngine.isEscoba(playedCard, tableCards, captureSet);

    // Then: the move is not an escoba
    expect(isEscoba).toBe(false);
  });

  it("should award escoba to player", () => {
    // Given: a player with no recorded escobas
    const player = { name: "Player 1", escobas: 0 };

    // When: an escoba point is awarded
    const updated = EscobaEngine.awardEscoba(player);

    // Then: the escoba counter increases by one
    expect(updated.escobas).toBe(1);
  });

  it("should treat leftover final table award as no escoba even when table is emptied", () => {
    // Given: no capture move, only the end-of-round automatic award semantics
    const scored = isScoringEscoba({
      tableCards: [new Card("copas", "7", 7)],
      captureSet: [],
      remainingHandCount: 0,
      remainingDeckCount: 0,
      enableFinalCardEscoba: false,
    });

    // When: escoba scoring helper is evaluated
    // Then: automatic final award can never score an escoba
    expect(scored).toBe(false);
  });

  it("should allow escoba on last card of an intermediate hand when stock remains", () => {
    // Given: last card in hand clears the table but stock still remains
    const scored = isScoringEscoba({
      tableCards: [new Card("copas", "7", 7)],
      captureSet: [new Card("copas", "7", 7)],
      remainingHandCount: 0,
      remainingDeckCount: 6,
      enableFinalCardEscoba: false,
    });

    // When: escoba scoring helper is evaluated with the house rule enabled
    // Then: the move still counts because the round is not over yet
    expect(scored).toBe(true);
  });

  it("should suppress escoba on the final card of the round when rule is disabled", () => {
    // Given: last card in hand clears the table and stock is exhausted
    const scored = isScoringEscoba({
      tableCards: [new Card("copas", "7", 7)],
      captureSet: [new Card("copas", "7", 7)],
      remainingHandCount: 0,
      remainingDeckCount: 0,
      enableFinalCardEscoba: false,
    });

    // When: escoba scoring helper is evaluated with the default rule
    // Then: the final-round sweep does not score an escoba
    expect(scored).toBe(false);
  });

  it("should score escoba on the final card of the round when option is enabled", () => {
    // Given: last card in hand clears the table and stock is exhausted
    const scored = isScoringEscoba({
      tableCards: [new Card("copas", "7", 7)],
      captureSet: [new Card("copas", "7", 7)],
      remainingHandCount: 0,
      remainingDeckCount: 0,
      enableFinalCardEscoba: true,
    });

    // When: escoba scoring helper is evaluated with the option enabled
    // Then: the final-round sweep scores normally
    expect(scored).toBe(true);
  });

  it("should identify a table sweep only when every table card is captured", () => {
    // Given: full and partial capture sets
    const tableCards = [new Card("copas", "2", 2), new Card("oros", "3", 3)];

    // When: comparing full and partial sweep detection
    const fullSweep = isTableSweep(tableCards, [...tableCards]);
    const partialSweep = isTableSweep(tableCards, [tableCards[0]]);

    // Then: only the full capture set counts as a sweep
    expect(fullSweep).toBe(true);
    expect(partialSweep).toBe(false);
  });
});
