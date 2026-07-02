/**
 * Test suite for move resolution and type tracking
 * Regression tests for issue: moveType/escoba not returned from playTurn()
 * Issue: Captures were being displayed as "Discarded a card"
 */

import { beforeEach, describe, expect, it } from "vitest";
import { Card } from "../core/card.js";
import { GameEngine } from "../core/game-engine.js";
import { GameState } from "../core/game-state.js";

describe("Move Resolution - Type Tracking and Return Values", () => {
  let gameEngine;
  let gameState;

  beforeEach(() => {
    gameEngine = new GameEngine();
    gameEngine.startGame();
    gameState = gameEngine.gameState;
  });

  describe("playTurn() - moveType and escoba tracking", () => {
    it("should return moveType='discard' for discard moves", () => {
      // Given: Player has hand and will discard
      const handCard = gameState.players[0].hand[0];
      const move = {
        card: handCard,
        isCapture: false,
      };

      // When: Player discards
      const result = gameEngine.playTurn(0, move);

      // Then: moveType should be 'discard'
      expect(result.success).toBe(true);
      expect(result.moveType).toBe("discard");
      expect(result.escoba).toBe(false);
    });

    it("should return moveType='capture' and escoba=false for regular captures", () => {
      // Given: Setup board with specific cards
      const handCard = new Card("oros", "7", 7);
      const tableCard1 = new Card("bastos", "2", 2);
      const tableCard2 = new Card("espadas", "6", 6);

      // Create new game state with these cards
      const newGameState = new GameState({
        ...gameEngine.config,
        players: [
          { hand: [handCard], pile: [], score: 0 },
          { hand: [], pile: [], score: 0 },
        ],
        tableCards: [tableCard1, tableCard2],
        deck: gameState.deck,
        phase: "playing",
        currentPlayerIndex: 0,
        stats: { escobas: [0, 0] },
      });
      gameEngine.gameState = newGameState;

      const move = {
        card: handCard,
        capture: [tableCard1, tableCard2], // 7 + 2 + 6 = 15
        isCapture: true,
        isEscoba: false,
      };

      // When: Player captures
      const result = gameEngine.playTurn(0, move);

      // Then: moveType should be 'capture' and escoba should be false
      expect(result.success).toBe(true);
      expect(result.moveType).toBe("capture");
      expect(result.escoba).toBe(false);
    });

    it("should return escoba=true when capturing all table cards", () => {
      // Given: Setup board with exactly 2 cards totaling 8 (so 7 + 8 = 15)
      const handCard = new Card("oros", "7", 7);
      const tableCard1 = new Card("bastos", "2", 2);
      const tableCard2 = new Card("espadas", "6", 6);
      const tableCards = [tableCard1, tableCard2]; // 2 + 6 = 8, plus hand card 7 = 15

      const newGameState = new GameState({
        ...gameEngine.config,
        players: [
          { hand: [handCard], pile: [], score: 0 },
          { hand: [], pile: [], score: 0 },
        ],
        tableCards: tableCards,
        deck: gameState.deck,
        phase: "playing",
        currentPlayerIndex: 0,
        stats: { escobas: [0, 0] },
      });
      gameEngine.gameState = newGameState;

      const move = {
        card: handCard,
        capture: tableCards, // Capturing ALL table cards
        isCapture: true,
        isEscoba: true, // Flag indicating it's an escoba
      };

      // When: Player captures entire table
      const result = gameEngine.playTurn(0, move);

      // Then: moveType should be 'capture' and escoba should be true
      expect(result.success).toBe(true);
      expect(result.moveType).toBe("capture");
      expect(result.escoba).toBe(true);
    });

    it("should include updatedState in successful move result", () => {
      // Given: Player will make a move
      const handCard = gameState.players[0].hand[0];
      const move = {
        card: handCard,
        isCapture: false,
      };

      // When: Move is executed
      const result = gameEngine.playTurn(0, move);

      // Then: Result should include updated game state
      expect(result.success).toBe(true);
      expect(result.updatedState).toBeDefined();
      expect(result.updatedState).toBeInstanceOf(GameState);
      expect(result.updatedState.currentPlayerIndex).not.toBe(
        gameState.currentPlayerIndex,
      );
    });
  });

  describe("Card removal verification", () => {
    it("should remove hand card from game state after capture", () => {
      // Given: Player selects hand card 7 and table cards summing to 8
      const handCard = new Card("oros", "7", 7);
      const otherCard = new Card("copas", "3", 3);
      const tableCard1 = new Card("bastos", "2", 2);
      const tableCard2 = new Card("espadas", "6", 6);

      const newGameState = new GameState({
        ...gameEngine.config,
        players: [
          { hand: [handCard, otherCard], pile: [], score: 0 },
          { hand: [], pile: [], score: 0 },
        ],
        tableCards: [tableCard1, tableCard2],
        deck: gameState.deck,
        phase: "playing",
        currentPlayerIndex: 0,
        stats: { escobas: [0, 0] },
      });
      gameEngine.gameState = newGameState;

      const move = {
        card: handCard,
        capture: [tableCard1, tableCard2],
        isCapture: true,
        isEscoba: true,
      };

      // When: Move executed
      const result = gameEngine.playTurn(0, move);

      // Then: Hand should no longer contain the played card
      expect(result.success).toBe(true);
      const newHand = result.updatedState.players[0].hand;
      expect(newHand).toHaveLength(1);
      expect(newHand[0].rank).toBe("3");
      expect(newHand.some((c) => c.rank === "7")).toBe(false);
    });

    it("should remove table cards from game state after capture", () => {
      // Given: Specific setup with hand 7 and table 2+6
      const handCard = new Card("oros", "7", 7);
      const tableCard1 = new Card("bastos", "2", 2);
      const tableCard2 = new Card("espadas", "6", 6);
      const tableCard3 = new Card("copas", "3", 3); // Extra card not captured

      const newGameState = new GameState({
        ...gameEngine.config,
        players: [
          { hand: [handCard], pile: [], score: 0 },
          { hand: [], pile: [], score: 0 },
        ],
        tableCards: [tableCard1, tableCard2, tableCard3],
        deck: gameState.deck,
        phase: "playing",
        currentPlayerIndex: 0,
        stats: { escobas: [0, 0] },
      });
      gameEngine.gameState = newGameState;

      const move = {
        card: handCard,
        capture: [tableCard1, tableCard2],
        isCapture: true,
        isEscoba: false,
      };

      // When: Move executed
      const result = gameEngine.playTurn(0, move);

      // Then: Table should only have the uncaptured card
      expect(result.success).toBe(true);
      expect(result.updatedState.tableCards).toHaveLength(1);
      expect(result.updatedState.tableCards[0].rank).toBe("3");
    });

    it("should add captured cards to player pile after capture", () => {
      // Given: Player capturing specific cards
      const handCard = new Card("oros", "7", 7);
      const tableCard1 = new Card("bastos", "2", 2);
      const tableCard2 = new Card("espadas", "6", 6);

      const newGameState = new GameState({
        ...gameEngine.config,
        players: [
          { hand: [handCard], pile: [], score: 0 },
          { hand: [], pile: [], score: 0 },
        ],
        tableCards: [tableCard1, tableCard2],
        deck: gameState.deck,
        phase: "playing",
        currentPlayerIndex: 0,
        stats: { escobas: [0, 0] },
      });
      gameEngine.gameState = newGameState;

      const move = {
        card: handCard,
        capture: [tableCard1, tableCard2],
        isCapture: true,
        isEscoba: false,
      };

      // When: Move executed
      const result = gameEngine.playTurn(0, move);

      // Then: Pile should contain hand card + captured cards
      expect(result.success).toBe(true);
      const newPile = result.updatedState.players[0].pile;
      expect(newPile).toHaveLength(3);
      expect(newPile.map((c) => c.rank).sort()).toEqual(["2", "6", "7"].sort());
    });
  });

  describe("Escoba flag tracking", () => {
    it("should increment escoba stats when escoba=true", () => {
      // Given: Board setup for escoba (capturing all table cards)
      const handCard = new Card("oros", "7", 7);
      const tableCard1 = new Card("bastos", "2", 2);
      const tableCard2 = new Card("espadas", "6", 6);

      const newGameState = new GameState({
        ...gameEngine.config,
        players: [
          { hand: [handCard], pile: [], score: 0 },
          { hand: [], pile: [], score: 0 },
        ],
        tableCards: [tableCard1, tableCard2],
        deck: gameState.deck,
        phase: "playing",
        currentPlayerIndex: 0,
        stats: { escobas: [0, 0] },
      });
      gameEngine.gameState = newGameState;

      const move = {
        card: handCard,
        capture: [tableCard1, tableCard2],
        isCapture: true,
        isEscoba: true,
      };

      // When: Move executed with escoba
      const result = gameEngine.playTurn(0, move);

      // Then: Escoba count should increment
      expect(result.success).toBe(true);
      expect(result.updatedState.stats.escobas[0]).toBe(1);
      expect(result.updatedState.stats.escobas[1]).toBe(0);
    });

    it("should NOT increment escoba stats when isEscoba=false despite capturing", () => {
      // Given: Capture that's not an escoba (some cards remain on table)
      const handCard = new Card("oros", "7", 7);
      const tableCard1 = new Card("bastos", "2", 2);
      const tableCard2 = new Card("espadas", "6", 6);
      const tableCard3 = new Card("copas", "5", 5);

      const newGameState = new GameState({
        ...gameEngine.config,
        players: [
          { hand: [handCard], pile: [], score: 0 },
          { hand: [], pile: [], score: 0 },
        ],
        tableCards: [tableCard1, tableCard2, tableCard3],
        deck: gameState.deck,
        phase: "playing",
        currentPlayerIndex: 0,
        stats: { escobas: [0, 0] },
      });
      gameEngine.gameState = newGameState;

      const move = {
        card: handCard,
        capture: [tableCard1, tableCard2],
        isCapture: true,
        isEscoba: false, // Not an escoba - card still on table
      };

      // When: Move executed without escoba
      const result = gameEngine.playTurn(0, move);

      // Then: Escoba count should NOT increment
      expect(result.success).toBe(true);
      expect(result.updatedState.stats.escobas[0]).toBe(0);
      expect(result.updatedState.stats.escobas[1]).toBe(0);
    });
  });

  describe("Move validation - Escoba de Quince rule", () => {
    it("should reject capture where hand + table ≠ 15", () => {
      // Given: Cards that DON'T sum to 15
      const handCard = new Card("oros", "7", 7);
      const tableCard1 = new Card("bastos", "2", 2);
      const tableCard2 = new Card("espadas", "3", 3); // 7 + 2 + 3 = 12, not 15

      const newGameState = new GameState({
        ...gameEngine.config,
        players: [
          { hand: [handCard], pile: [], score: 0 },
          { hand: [], pile: [], score: 0 },
        ],
        tableCards: [tableCard1, tableCard2],
        deck: gameState.deck,
        phase: "playing",
        currentPlayerIndex: 0,
        stats: { escobas: [0, 0] },
      });
      gameEngine.gameState = newGameState;

      const move = {
        card: handCard,
        capture: [tableCard1, tableCard2],
        isCapture: true,
        isEscoba: true,
      };

      // When: Move attempted
      const result = gameEngine.playTurn(0, move);

      // Then: Should fail validation
      expect(result.success).toBe(false);
      expect(result.error).toContain("must equal 15");
    });

    it("should accept capture where hand + table = 15", () => {
      // Given: Cards that sum to exactly 15
      const handCard = new Card("oros", "7", 7);
      const tableCard1 = new Card("bastos", "2", 2);
      const tableCard2 = new Card("espadas", "6", 6); // 7 + 2 + 6 = 15 ✓

      const newGameState = new GameState({
        ...gameEngine.config,
        players: [
          { hand: [handCard], pile: [], score: 0 },
          { hand: [], pile: [], score: 0 },
        ],
        tableCards: [tableCard1, tableCard2],
        deck: gameState.deck,
        phase: "playing",
        currentPlayerIndex: 0,
        stats: { escobas: [0, 0] },
      });
      gameEngine.gameState = newGameState;

      const move = {
        card: handCard,
        capture: [tableCard1, tableCard2],
        isCapture: true,
        isEscoba: true,
      };

      // When: Move attempted
      const result = gameEngine.playTurn(0, move);

      // Then: Should succeed
      expect(result.success).toBe(true);
      expect(result.moveType).toBe("capture");
    });
  });
});
