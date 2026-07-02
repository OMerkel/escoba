/**
 * Test suite for Negamax AI strategy
 * Tests: alpha-beta pruning, iterative deepening, evaluation
 * Requirement: FR-15.1b (Negamax AI strategy)
 */

import { describe, expect, it } from "vitest";
import {
  evaluatePosition,
  generateMoves,
  iterativeDeepeningSearch,
  negamaxSearch,
  selectNegamaxMove,
} from "../ai/negamax.js";
import { Card } from "../core/card.js";

describe("AI Strategy - Negamax", () => {
  describe("Position Evaluation", () => {
    it("should evaluate game position", () => {
      // Given: game state with scores
      const gameState = {
        currentPlayerIndex: 0,
        scores: [10, 5],
      };

      // When: evaluating position
      const score = evaluatePosition(gameState);

      // Then: should return difference (10-5=5)
      expect(score).toBe(5);
    });

    it("should return 0 for null position", () => {
      // Given: null game state
      // When: evaluating
      const score = evaluatePosition(null);

      // Then: should return 0
      expect(score).toBe(0);
    });
  });

  describe("Move Generation", () => {
    it("should generate discard moves", () => {
      // Given: hand with 3 cards
      const hand = [
        new Card("oros", "3", 3),
        new Card("copas", "5", 5),
        new Card("espadas", "2", 2),
      ];
      const tableCards = [];

      // When: generating moves
      const moves = generateMoves(hand, tableCards);

      // Then: should have 3 discard moves
      expect(moves.length).toBe(3);
      expect(moves.every((m) => !m.isCapture)).toBe(true);
    });

    it("should return empty for empty hand", () => {
      // Given: empty hand
      const hand = [];
      const tableCards = [];

      // When: generating moves
      const moves = generateMoves(hand, tableCards);

      // Then: should be empty
      expect(moves.length).toBe(0);
    });
  });

  describe("Negamax Search", () => {
    it("should perform negamax search", () => {
      // Given: game state
      const gameState = {
        currentPlayerIndex: 0,
        scores: [5, 3],
      };
      const hand = [new Card("oros", "5", 5)];
      const tableCards = [];

      // When: searching
      const result = negamaxSearch(
        gameState,
        2,
        Number.NEGATIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        hand,
        tableCards,
      );

      // Then: should return move and score
      expect(result).not.toBeNull();
      expect(result.move).not.toBeNull();
      expect(typeof result.score).toBe("number");
    });

    it("should apply alpha-beta pruning", () => {
      // Given: game state with multiple moves
      const gameState = {
        currentPlayerIndex: 0,
        scores: [10, 8],
      };
      const hand = [
        new Card("oros", "3", 3),
        new Card("copas", "2", 2),
        new Card("espadas", "4", 4),
      ];
      const tableCards = [];

      // When: searching with pruning
      const result = negamaxSearch(
        gameState,
        1,
        Number.NEGATIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        hand,
        tableCards,
      );

      // Then: should complete and find best move
      expect(result.move).not.toBeNull();
      expect(result.score).toBeDefined();
    });
  });

  describe("Iterative Deepening", () => {
    it("should implement iterative deepening", () => {
      // Given: game state
      const gameState = {
        currentPlayerIndex: 0,
        scores: [7, 4],
      };
      const hand = [new Card("oros", "5", 5), new Card("copas", "3", 3)];
      const tableCards = [];

      // When: searching with iterative deepening
      const result = iterativeDeepeningSearch(
        gameState,
        hand,
        tableCards,
        1000,
        3,
      );

      // Then: should have found move at some depth
      expect(result.move).not.toBeNull();
      expect(result.depth).toBeGreaterThan(0);
      expect(result.depth).toBeLessThanOrEqual(3);
    });

    it("should respect time limits", async () => {
      // Given: game state with time constraint
      const gameState = {
        currentPlayerIndex: 0,
        scores: [5, 3],
      };
      const hand = [
        new Card("oros", "5", 5),
        new Card("copas", "3", 3),
        new Card("espadas", "2", 2),
      ];
      const tableCards = [];
      const maxTime = 500; // ms

      // When: searching with time limit
      const startTime = Date.now();
      const result = iterativeDeepeningSearch(
        gameState,
        hand,
        tableCards,
        maxTime,
        10,
      );
      const elapsed = Date.now() - startTime;

      // Then: should respect time limit and return valid move
      expect(result.move).not.toBeNull();
      expect(elapsed).toBeLessThan(maxTime * 1.5); // Allow 50% overage
    });
  });

  describe("Negamax Strategy", () => {
    it("should select move using negamax", () => {
      // Given: game state and hand
      const hand = [new Card("oros", "5", 5), new Card("copas", "2", 2)];
      const tableCards = [];
      const gameState = {
        currentPlayerIndex: 0,
        scores: [8, 5],
      };
      const config = { aiResponseTime: 1000, negamaxDepth: 2 };

      // When: selecting move
      const move = selectNegamaxMove(hand, tableCards, gameState, config);

      // Then: should return valid move
      expect(move).not.toBeNull();
      expect(move.card).toBeDefined();
    });
  });
});
