/**
 * Test suite for RulesEngine module
 * Tests: forced capture, special initial conditions, move validation
 * Requirement: FR-4.3, FR-10, FR-11 (Game rules)
 */

import { describe, expect, it } from "vitest";
import { Card } from "../core/card.js";
import { RulesEngine } from "../core/rules.js";

describe("RulesEngine", () => {
  it("should detect special initial condition (sum 15)", () => {
    const tableCards = [
      new Card("oros", "5", 5),
      new Card("copas", "7", 7),
      new Card("espadas", "3", 3),
    ];

    const hasSpecial = RulesEngine.hasSpecialInitialCondition(tableCards);
    expect(hasSpecial).toBe(true);
  });

  it("should validate valid move without capture", () => {
    const playedCard = new Card("oros", "5", 5);
    const tableCards = [new Card("copas", "3", 3)];

    const result = RulesEngine.validateMove(playedCard, tableCards, []);
    expect(result.valid).toBe(true);
  });

  it("should invalidate move with incorrect capture sum", () => {
    const playedCard = new Card("oros", "7", 7);
    const tableCards = [new Card("copas", "2", 2), new Card("espadas", "3", 3)];
    const selectedCapture = [new Card("copas", "2", 2)];

    const result = RulesEngine.validateMove(
      playedCard,
      tableCards,
      selectedCapture,
    );
    expect(result.valid).toBe(false);
  });
});
