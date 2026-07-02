/**
 * Test suite for CaptureEngine module
 * Tests: capture validation, subset generation, preference rules
 * Requirement: FR-4, FR-5 (Capture mechanics)
 */

import { describe, expect, it } from "vitest";
import { CaptureEngine } from "../core/capture.js";
import { Card } from "../core/card.js";

describe("CaptureEngine", () => {
  it("should find valid captures for Escoba de Quince (hand + table = 15)", () => {
    // Escoba de Quince: hand card (7) + table cards (8) = 15
    const playedCard = new Card("oros", "7", 7);
    const tableCards = [
      new Card("copas", "3", 3),
      new Card("espadas", "4", 4),
      new Card("bastos", "1", 1),
    ];

    const captures = CaptureEngine.getValidCaptures(playedCard, tableCards);
    // 7 + 3 + 4 + 1 = 15 ✓, and other combinations too
    expect(captures.length).toBeGreaterThan(0);
  });

  it("should return empty captures for impossible sum", () => {
    // Hand card 15 + any table cards will exceed 15
    const playedCard = new Card("oros", "10", 10);
    const tableCards = [new Card("copas", "10", 10)]; // 10 + 10 = 20, not 15

    const captures = CaptureEngine.getValidCaptures(playedCard, tableCards);
    expect(captures).toHaveLength(0);
  });

  it("should detect if capture is available", () => {
    // Hand card (5) + table card (10) = 15
    const playedCard = new Card("oros", "5", 5);
    const tableCards = [
      new Card("copas", "10", 10), // 5 + 10 = 15 ✓
      new Card("espadas", "3", 3),
    ];

    const has = CaptureEngine.hasCapture(playedCard, tableCards);
    expect(has).toBe(true);
  });

  it("should apply single-complement preference", () => {
    const singleCard = [[new Card("oros", "5", 5)]];
    const multiCard = [[new Card("oros", "2", 2), new Card("oros", "3", 3)]];
    const captures = [...singleCard, ...multiCard];

    const preferred = CaptureEngine.applySingleComplementPreference(captures);
    expect(preferred).toHaveLength(1);
    expect(preferred[0]).toHaveLength(1);
  });
});
