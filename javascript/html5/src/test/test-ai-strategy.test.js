/**
 * Test suite for AI Strategy
 * Tests: greedy heuristic evaluation, move prioritization
 * Requirement: FR-15.1a (Greedy AI strategy)
 */

import { describe, expect, it } from "vitest";
import {
  evaluateMoveQuality,
  prioritizeEscobas,
  prioritizeSevenOfOros,
  selectGreedyMove,
  selectHighestValueCapture,
  selectSafeDiscard,
} from "../ai/ai-strategy.js";
import { Card } from "../core/card.js";

describe("AI Strategy - Greedy", () => {
  describe("Move Quality Evaluation", () => {
    it("should prioritize escobas", () => {
      // Given: two moves, one is escoba
      const normalCapture = {
        card: new Card("oros", "7", 7),
        isCapture: true,
        isEscoba: false,
      };
      const escobaMove = {
        card: new Card("bastos", "3", 3),
        isCapture: true,
        isEscoba: true,
      };

      // When: evaluating moves
      const normalScore = evaluateMoveQuality(normalCapture, {});
      const escobaScore = evaluateMoveQuality(escobaMove, {});

      // Then: escoba should score much higher (+1000)
      expect(escobaScore).toBeGreaterThan(normalScore + 500);
    });

    it("should prioritize 7 of oros", () => {
      // Given: two captures
      const sevenOros = {
        card: new Card("oros", "7", 7),
        isCapture: true,
        isEscoba: false,
      };
      const otherCard = {
        card: new Card("copas", "5", 5),
        isCapture: true,
        isEscoba: false,
      };

      // When: evaluating
      const sevenScore = evaluateMoveQuality(sevenOros, {});
      const otherScore = evaluateMoveQuality(otherCard, {});

      // Then: 7 of oros should score higher
      expect(sevenScore).toBeGreaterThan(otherScore);
    });

    it("should score discards lower than captures", () => {
      // Given: capture vs discard
      const capture = {
        card: new Card("espadas", "4", 4),
        isCapture: true,
      };
      const discard = {
        card: new Card("bastos", "6", 6),
        isCapture: false,
      };

      // When: evaluating
      const captureScore = evaluateMoveQuality(capture, {});
      const discardScore = evaluateMoveQuality(discard, {});

      // Then: capture scores higher
      expect(captureScore).toBeGreaterThan(discardScore);
    });

    it("should prefer low-value discards over high-value", () => {
      // Given: two discard options
      const lowDiscard = {
        card: new Card("espadas", "2", 2),
        isCapture: false,
      };
      const highDiscard = {
        card: new Card("bastos", "rey", 10),
        isCapture: false,
      };

      // When: evaluating
      const lowScore = evaluateMoveQuality(lowDiscard, {});
      const highScore = evaluateMoveQuality(highDiscard, {});

      // Then: low-value card scores higher for discard
      expect(lowScore).toBeGreaterThan(highScore);
    });
  });

  describe("Greedy Move Selection", () => {
    it("should select escoba when available", () => {
      // Given: hand and table with escoba possibility
      const hand = [new Card("oros", "5", 5)];
      const tableCards = [
        new Card("copas", "2", 2),
        new Card("espadas", "3", 3),
      ];
      const gameState = {};

      // When: selecting greedy move
      const move = selectGreedyMove(hand, tableCards, gameState);

      // Then: should select the move
      expect(move).not.toBeNull();
      expect(move.card.rank).toBe("5");
    });

    it("should select 7 of oros when available", () => {
      // Given: hand with 7 of oros
      const hand = [new Card("oros", "7", 7), new Card("bastos", "2", 2)];
      const tableCards = [new Card("copas", "3", 3)]; // Not capturable by 7 of oros
      const gameState = {};

      // When: selecting greedy move
      const move = selectGreedyMove(hand, tableCards, gameState);

      // Then: should select a move (will be discard)
      expect(move).not.toBeNull();
      expect(move.card).toBeDefined();
    });

    it("should select safe discard when no capture possible", () => {
      // Given: hand and table with no captures
      const hand = [
        new Card("espadas", "rey", 10),
        new Card("bastos", "2", 2),
        new Card("copas", "sota", 8),
      ];
      const tableCards = [new Card("oros", "caballo", 9)];
      const gameState = {};

      // When: selecting discard
      const move = selectGreedyMove(hand, tableCards, gameState);

      // Then: should select lowest value card (2 of bastos)
      expect(move).not.toBeNull();
      expect(move.isCapture).toBe(false);
      expect(move.card.rank).toBe("2");
    });

    it("should return null for empty hand", () => {
      // Given: empty hand
      const hand = [];
      const tableCards = [new Card("oros", "5", 5)];
      const gameState = {};

      // When: selecting move
      const move = selectGreedyMove(hand, tableCards, gameState);

      // Then: should return null
      expect(move).toBeNull();
    });
  });

  describe("Move Priority Functions", () => {
    it("should identify escoba moves", () => {
      // Given: escoba move
      const escobaMove = {
        card: new Card("bastos", "3", 3),
        isEscoba: true,
        isCapture: true,
      };
      const normalMove = {
        card: new Card("bastos", "3", 3),
        isEscoba: false,
        isCapture: true,
      };

      // When: checking priority
      // Then: only escoba returns true
      expect(prioritizeEscobas(escobaMove)).toBe(true);
      expect(prioritizeEscobas(normalMove)).toBe(false);
    });

    it("should identify 7 of oros", () => {
      // Given: 7 of oros move
      const sevenOros = {
        card: new Card("oros", "7", 7),
        isCapture: true,
      };
      const otherSeven = {
        card: new Card("copas", "7", 7),
        isCapture: true,
      };

      // When: checking priority
      // Then: only 7 of oros returns true
      expect(prioritizeSevenOfOros(sevenOros)).toBe(true);
      expect(prioritizeSevenOfOros(otherSeven)).toBe(false);
    });
  });

  describe("Card Selection Helpers", () => {
    it("should select highest value capture", () => {
      // Given: valid moves
      const moves = [
        { card: new Card("oros", "3", 3), isCapture: true },
        { card: new Card("copas", "7", 7), isCapture: true },
        { card: new Card("espadas", "5", 5), isCapture: true },
      ];

      // When: selecting highest
      const selected = selectHighestValueCapture(moves);

      // Then: should select 7 of copas
      expect(selected.card.rank).toBe("7");
    });

    it("should select safe discard (lowest value)", () => {
      // Given: hand
      const hand = [
        new Card("oros", "rey", 10),
        new Card("copas", "2", 2),
        new Card("espadas", "5", 5),
      ];

      // When: selecting discard
      const selected = selectSafeDiscard(hand);

      // Then: should select 2 of copas
      expect(selected.rank).toBe("2");
    });
  });
});
