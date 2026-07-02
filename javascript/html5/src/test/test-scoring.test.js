/**
 * Test suite for ScoringEngine module
 * Tests: all 5 scoring categories
 * Requirement: FR-8 (Scoring rules)
 */

import { describe, expect, it } from "vitest";
import { Card } from "../core/card.js";
import { ScoringEngine } from "../core/scoring.js";

describe("ScoringEngine", () => {
  it("should score cards category correctly", () => {
    const result1 = ScoringEngine.scoreCards(25, 15);
    expect(result1.p1).toBe(1);
    expect(result1.p2).toBe(0);

    const result2 = ScoringEngine.scoreCards(15, 15);
    expect(result2.p1).toBe(0);
    expect(result2.p2).toBe(0);
  });

  it("should score oros category correctly", () => {
    const result = ScoringEngine.scoreOros(7, 3);
    expect(result.p1).toBe(1);
    expect(result.p2).toBe(0);
  });

  it("should score 7 of oros correctly", () => {
    const result1 = ScoringEngine.score7Oros(true, false);
    expect(result1.p1).toBe(1);
    expect(result1.p2).toBe(0);

    const result2 = ScoringEngine.score7Oros(false, false);
    expect(result2.p1).toBe(0);
    expect(result2.p2).toBe(0);
  });

  it("should score escobas correctly", () => {
    const result = ScoringEngine.scoreEscobas(3, 2);
    expect(result.p1).toBe(3);
    expect(result.p2).toBe(2);
  });

  it("should score setenta using prime method from rules", () => {
    const p1Cards = [
      new Card("oros", "7", 7),
      new Card("copas", "7", 7),
      new Card("espadas", "6", 6),
      new Card("bastos", "5", 5),
    ];

    const p2Cards = [
      new Card("oros", "7", 7),
      new Card("copas", "7", 7),
      new Card("espadas", "as", 1),
      new Card("bastos", "as", 1),
    ];

    const result = ScoringEngine.scoreSetenta("prime", p1Cards, p2Cards);
    expect(result).toEqual({ p1: 1, p2: 0 });
  });

  it("should tie setenta when prime vectors are equal", () => {
    const p1Cards = [
      new Card("oros", "7", 7),
      new Card("copas", "6", 6),
      new Card("espadas", "as", 1),
      new Card("bastos", "5", 5),
    ];
    const p2Cards = [
      new Card("oros", "7", 7),
      new Card("copas", "6", 6),
      new Card("espadas", "as", 1),
      new Card("bastos", "5", 5),
    ];

    const result = ScoringEngine.scoreSetenta("prime", p1Cards, p2Cards);
    expect(result).toEqual({ p1: 0, p2: 0 });
  });
});
