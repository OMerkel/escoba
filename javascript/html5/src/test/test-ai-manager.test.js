/**
 * Test suite for AI Manager
 * Tests: strategy selection, async execution, move validation
 * Requirement: FR-12, FR-15 (AI player support)
 */

import { describe, expect, it } from "vitest";
import {
  AIManager,
  executeAIMove,
  selectStrategy,
  validateAIMove,
} from "../ai/ai-manager.js";
import { Card } from "../core/card.js";

describe("AI Manager", () => {
  describe("Strategy Selection", () => {
    it("should select greedy strategy from config", () => {
      // Given: config with greedy strategy
      const config = { aiStrategy: "greedy" };

      // When: selecting strategy
      const strategy = selectStrategy(config);

      // Then: should return greedy function
      expect(typeof strategy).toBe("function");
      expect(strategy.name).toMatch(/greedy|selectGreedyMove/i);
    });

    it("should default to greedy when no strategy specified", () => {
      // Given: empty config
      const config = {};

      // When: selecting strategy
      const strategy = selectStrategy(config);

      // Then: should default to greedy
      expect(typeof strategy).toBe("function");
    });
  });

  describe("Move Execution", () => {
    it("should execute AI move asynchronously", async () => {
      // Given: strategy and game state
      const strategy = (hand, table) => {
        void table;
        return {
        card: hand[0],
        isCapture: false,
        };
      };
      const hand = [new Card("oros", "5", 5)];
      const table = [];
      const gameState = {};
      const config = { aiResponseTime: 1000 };

      // When: executing move
      const move = await executeAIMove(
        strategy,
        hand,
        table,
        gameState,
        config,
      );

      // Then: should return move
      expect(move).not.toBeNull();
      expect(move.card).toBeDefined();
    });

    it("should respect response time limits", async () => {
      // Given: slow strategy with timeout
      const slowStrategy = (hand, table) => {
        void table;
        // Simulate slow execution
        return { card: hand[0], isCapture: false };
      };
      const hand = [new Card("oros", "5", 5)];
      const table = [];
      const gameState = {};
      const config = { aiResponseTime: 2000 };

      // When: executing move
      const startTime = Date.now();
      const move = await executeAIMove(
        slowStrategy,
        hand,
        table,
        gameState,
        config,
      );
      const elapsed = Date.now() - startTime;

      // Then: should complete within timeout and return valid move
      expect(elapsed).toBeLessThan(config.aiResponseTime);
      expect(move).not.toBeNull();
    });
  });

  describe("Move Validation", () => {
    it("should validate AI move before execution", () => {
      // Given: valid Escoba de Quince move (hand + table = 15)
      const card = new Card("oros", "7", 7); // Hand card
      const hand = [card, new Card("copas", "2", 2)];
      const table = [new Card("bastos", "8", 8)]; // 7 + 8 = 15 ✓
      const move = {
        card,
        isCapture: true,
        capture: table,
      };

      // When: validating move
      const isValid = validateAIMove(move, hand, table);

      // Then: should be valid
      expect(isValid).toBe(true);
    });

    it("should reject move with card not in hand", () => {
      // Given: move with card not in hand
      const cardNotInHand = new Card("espadas", "7", 7);
      const hand = [new Card("oros", "5", 5)];
      const table = [];
      const move = { card: cardNotInHand, isCapture: false };

      // When: validating
      const isValid = validateAIMove(move, hand, table);

      // Then: should be invalid
      expect(isValid).toBe(false);
    });

    it("should reject move with invalid capture", () => {
      // Given: invalid capture (wrong card value)
      const card = new Card("oros", "5", 5);
      const captureCard = new Card("copas", "3", 3);
      const hand = [card];
      const table = [captureCard]; // sum = 3, but card value = 5
      const move = {
        card,
        isCapture: true,
        capture: [captureCard],
      };

      // When: validating
      const isValid = validateAIMove(move, hand, table);

      // Then: should be invalid
      expect(isValid).toBe(false);
    });

    it("should validate null move as invalid", () => {
      // Given: null move
      const hand = [new Card("oros", "5", 5)];
      const table = [];

      // When: validating null
      const isValid = validateAIMove(null, hand, table);

      // Then: should be invalid
      expect(isValid).toBe(false);
    });
  });

  describe("AI Manager Class", () => {
    it("should create manager with strategy and config", () => {
      // Given: strategy and config
      const config = { aiResponseTime: 2000 };

      // When: creating manager
      const manager = new AIManager("greedy", config);

      // Then: should store config
      expect(manager.strategy).toBe("greedy");
      expect(manager.responseTimeLimit).toBe(2000);
    });

    it("should select strategy via manager", () => {
      // Given: manager instance
      const manager = new AIManager("greedy", {});

      // When: selecting strategy
      const strategy = manager.selectStrategy("greedy");

      // Then: should return function
      expect(typeof strategy).toBe("function");
    });
  });
});
