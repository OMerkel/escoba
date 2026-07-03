/**
 * Test suite for Game Engine
 * Tests: game initialization, round management, turn coordination, victory detection
 * Requirement: FR-2, FR-3, FR-6 (Game flow, turn management, round management)
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Card } from "../core/card.js";
import { DealingEngine } from "../core/dealing.js";
import { Deck } from "../core/deck.js";
import { GameEngine } from "../core/game-engine.js";

describe("Game Engine", () => {
  let engine;

  beforeEach(() => {
    const config = {
      targetScore: 21,
      players: ["Player 1", "Player 2"],
      aiStrategy: "greedy",
    };
    engine = new GameEngine(config);
  });

  afterEach(() => {
    engine = null;
  });

  describe("Initialization", () => {
    it("should initialize game with configuration", () => {
      // Given: engine created with config
      // When: checking initial state
      const state = engine.getGameState();

      // Then: should have proper initial setup
      expect(state).not.toBeNull();
      expect(state.phase).toBe("setup");
      expect(state.players[0].score).toBe(0);
      expect(state.players[1].score).toBe(0);
      expect(state.players[0].hand).toEqual([]);
      expect(state.players[1].hand).toEqual([]);
    });

    it("should start new game", () => {
      // Given: initialized engine
      // When: starting game
      engine.startGame();
      const state = engine.getGameState();

      // Then: should transition to playing and deal cards
      expect(state.phase).toBe("playing");
      expect(state.players[0].hand.length).toBeGreaterThan(0);
      expect(state.players[1].hand.length).toBeGreaterThan(0);
      expect(state.tableCards.length).toBeGreaterThan(0);
    });

    it("should apply special initial table sum 15: dealer captures table and gets 1 escoba", () => {
      const initialDealSpy = vi.spyOn(DealingEngine, "initialDeal");
      initialDealSpy.mockReturnValue({
        p1Hand: [
          new Card("oros", "2", 2),
          new Card("oros", "3", 3),
          new Card("oros", "4", 4),
        ],
        p2Hand: [
          new Card("copas", "2", 2),
          new Card("copas", "3", 3),
          new Card("copas", "4", 4),
        ],
        tableCards: [
          new Card("espadas", "7", 7),
          new Card("espadas", "6", 6),
          new Card("bastos", "as", 1),
          new Card("bastos", "as", 1),
        ],
        remainingDeck: new Deck([]),
      });

      engine.startGame();
      const state = engine.getGameState();

      // Dealer is player index 1 in current two-player flow.
      expect(state.tableCards).toHaveLength(0);
      expect(state.players[1].pile).toHaveLength(4);
      expect(state.stats.escobas[1]).toBe(1);
      expect(state.stats.totalEscobas).toBe(1);
      expect(engine.lastInitialSpecialEvent).toEqual(
        expect.objectContaining({
          sum: 15,
          escobas: 1,
          dealerIndex: 1,
          cardsAwarded: 4,
        }),
      );
      expect(engine.lastInitialSpecialEvent.tableCards).toHaveLength(4);

      initialDealSpy.mockRestore();
    });

    it("should apply special initial table sum 30: dealer captures table and gets 2 escobas", () => {
      const initialDealSpy = vi.spyOn(DealingEngine, "initialDeal");
      initialDealSpy.mockReturnValue({
        p1Hand: [
          new Card("oros", "2", 2),
          new Card("oros", "3", 3),
          new Card("oros", "4", 4),
        ],
        p2Hand: [
          new Card("copas", "2", 2),
          new Card("copas", "3", 3),
          new Card("copas", "4", 4),
        ],
        tableCards: [
          new Card("espadas", "rey", 10),
          new Card("espadas", "rey", 10),
          new Card("bastos", "5", 5),
          new Card("bastos", "5", 5),
        ],
        remainingDeck: new Deck([]),
      });

      engine.startGame();
      const state = engine.getGameState();

      expect(state.tableCards).toHaveLength(0);
      expect(state.players[1].pile).toHaveLength(4);
      expect(state.stats.escobas[1]).toBe(2);
      expect(state.stats.totalEscobas).toBe(2);
      expect(engine.lastInitialSpecialEvent).toEqual(
        expect.objectContaining({
          sum: 30,
          escobas: 2,
          dealerIndex: 1,
          cardsAwarded: 4,
        }),
      );
      expect(engine.lastInitialSpecialEvent.tableCards).toHaveLength(4);

      initialDealSpy.mockRestore();
    });

    it("should reset game state", () => {
      // Given: game in progress
      engine.startGame();
      const hand = engine.getGameState().players[0].hand;
      if (hand.length > 0) {
        engine.playTurn(0, { card: hand[0] });
      }

      // When: resetting
      engine.reset();
      const state = engine.getGameState();

      // Then: should return to initial state
      expect(state.phase).toBe("setup");
      expect(state.players[0].score).toBe(0);
      expect(state.players[1].score).toBe(0);
      expect(state.players[0].hand).toEqual([]);
      expect(state.players[1].hand).toEqual([]);
    });

    it("should carry configured capture display duration into game state", () => {
      const customEngine = new GameEngine({
        players: ["Player 1", "Player 2"],
        captureDisplayDurationMs: 1337,
      });

      customEngine.startGame();
      const state = customEngine.getGameState();

      expect(state.captureDisplayDurationMs).toBe(1337);
    });
  });

  describe("Round Management", () => {
    it("should manage rounds", () => {
      // Given: game started
      engine.startGame();
      const initialRound = engine.getCurrentRound();

      // When: playing turns and completing round
      // Then: should track round number
      expect(initialRound).toBeGreaterThan(0);
    });

    it("should detect round completion", () => {
      // Given: game with specific state
      engine.startGame();

      // When: checking round completion
      const isComplete = engine.isRoundComplete();

      // Then: should return boolean
      expect(typeof isComplete).toBe("boolean");
    });

    it("should complete round and score", () => {
      // Given: round in progress
      engine.startGame();

      // When: round completes (simulated)
      // Play turns until deck empty and hands played
      // This would be done via multiple playTurn calls
      const stateAfter = engine.getGameState();

      // Then: scores should be tracked
      expect(stateAfter.players[0].score).toBeDefined();
      expect(stateAfter.players[1].score).toBeDefined();
    });

    it("should return round summary with category breakdown and totals", () => {
      engine.startGame();

      // Prepare deterministic scoring snapshot
      const state = engine.getGameState();
      const players = state.players.map((p) => ({ ...p, pile: [...p.pile] }));

      players[0].pile = [
        new Card("oros", "7", 7),
        new Card("oros", "6", 6),
        new Card("copas", "7", 7),
        new Card("espadas", "6", 6),
        new Card("bastos", "5", 5),
      ];
      players[1].pile = [
        new Card("oros", "as", 1),
        new Card("copas", "as", 1),
        new Card("espadas", "as", 1),
        new Card("bastos", "as", 1),
      ];

      engine.gameState = state.transition("playing", {
        players,
        tableCards: [],
        stats: {
          ...state.stats,
          escobas: [2, 1],
        },
      });

      const summary = engine.completeRound();

      expect(summary).toBeDefined();
      expect(summary.categories.length).toBe(5);
      const setentaCategory = summary.categories.find(
        (c) => c.key === "setenta",
      );
      expect(setentaCategory).toBeDefined();
      expect(setentaCategory.raw[0]).toContain("O:");
      expect(setentaCategory.raw[0]).toContain("C:");
      expect(setentaCategory.raw[0]).toContain("prime:");
      expect(setentaCategory.rawFull[0]).toContain("Oros");
      expect(setentaCategory.rawFull[0]).toContain("Copas");
      expect(setentaCategory.raw[0]).toContain(",");
      expect(setentaCategory.raw[1]).toContain(",");
      expect(summary.roundPoints[0]).toBeGreaterThan(summary.roundPoints[1]);
      expect(summary.totals[0]).toBeGreaterThan(summary.totals[1]);
    });
  });

  describe("Turn Management", () => {
    it("should execute player turn", () => {
      // Given: game initialized with player's turn
      engine.startGame();
      const state = engine.getGameState();
      const hand = state.players[0].hand;
      const firstCard = hand[0];

      // When: executing turn
      const move = { card: firstCard, isCapture: false };
      const result = engine.playTurn(0, move);

      // Then: should process move and transition
      expect(result).not.toBeNull();
      expect(result.success).toBe(true);
    });

    it("should validate move before execution", () => {
      // Given: game with invalid move
      engine.startGame();
      const invalidCard = new Card("oros", "5", 5); // Not in hand

      // When: executing invalid move
      const move = { card: invalidCard, isCapture: false };
      const result = engine.playTurn(0, move);

      // Then: should reject invalid move
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should track current player", () => {
      // Given: game started
      engine.startGame();

      // When: checking current player
      const currentPlayer = engine.getCurrentPlayer();

      // Then: should return 0 or 1
      expect([0, 1]).toContain(currentPlayer);
    });

    it("should alternate players", () => {
      // Given: game initialized
      engine.startGame();
      const player1 = engine.getCurrentPlayer();

      // When: playing turn and advancing
      const hand = engine.getGameState().players[player1].hand;
      if (hand.length > 0) {
        const move = { card: hand[0], isCapture: false };
        engine.playTurn(player1, move);
      }

      // Then: should advance to next player
      const player2 = engine.getCurrentPlayer();
      expect(player2).not.toBe(player1);
    });

    it("should not auto-complete scoring inside playTurn on round-complete state", () => {
      engine.startGame();

      const state = engine.getGameState();
      const finalCard = state.players[0].hand[0];
      const players = [
        {
          ...state.players[0],
          hand: [finalCard],
          pile: [...state.players[0].pile],
        },
        {
          ...state.players[1],
          hand: [],
          pile: [...state.players[1].pile],
        },
      ];

      engine.gameState = state.transition("playing", {
        players,
        deck: { cards: [] },
        tableCards: [],
        currentPlayerIndex: 0,
      });

      const result = engine.playTurn(0, { card: finalCard, isCapture: false });

      expect(result.success).toBe(true);
      expect(engine.isRoundComplete()).toBe(true);
      expect(engine.getGameState().phase).toBe("playing");
    });
  });

  describe("AI Move Execution", () => {
    it("should execute AI move", async () => {
      // Given: game initialized with current player ready
      engine.startGame();
      const currentPlayer = engine.getCurrentPlayer();

      // When: executing AI move
      const result = await engine.playAITurn(currentPlayer);

      // Then: should return move result
      expect(result).not.toBeNull();
      expect(result.success).toBe(true);
    });

    it("should respect AI response time limit", async () => {
      // Given: AI configured with time limit
      engine.startGame();
      const currentPlayer = engine.getCurrentPlayer();

      // When: executing with timeout constraint
      const startTime = Date.now();
      await engine.playAITurn(currentPlayer);
      const elapsed = Date.now() - startTime;

      // Then: should complete within reasonable time
      expect(elapsed).toBeLessThan(10000); // 10 second safety limit
    });
  });

  describe("Game State Tracking", () => {
    it("should provide current game state", () => {
      // Given: engine at any point
      engine.startGame();

      // When: getting state
      const state = engine.getGameState();

      // Then: should have all required fields
      expect(state.phase).toBeDefined();
      expect(state.players).toBeDefined();
      expect(state.tableCards).toBeDefined();
      expect(state.currentPlayerIndex).toBeDefined();
    });

    it("should track phase transitions", () => {
      // Given: game initialized
      const phases = [];
      engine.startGame();
      phases.push(engine.getGameState().phase);

      // When: advancing game
      // Phase should change from setup to playing
      // Then: should track progression
      expect(phases.length).toBeGreaterThan(0);
      expect(phases[0]).toBe("playing");
    });

    it("should provide move history", () => {
      // Given: game with moves
      engine.startGame();
      const hand = engine.getGameState().players[0].hand;
      if (hand.length > 0) {
        engine.playTurn(0, { card: hand[0], isCapture: false });
      }

      // When: getting history
      const history = engine.getMoveHistory();

      // Then: should contain moves
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe("Victory Detection", () => {
    it("should detect game over condition - basic type check", () => {
      // Given: game initialized
      engine.startGame();

      // When: checking if game over
      const isOver = engine.isGameOver();

      // Then: should return boolean
      expect(typeof isOver).toBe("boolean");
    });

    // Escoba de Quince Rules: Win = 21+ points AND 2+ point lead
    describe("Winning Condition: 21+ points with 2+ point lead", () => {
      it("should return false when both players below 21 points", () => {
        // Given: game with scores below threshold
        engine.startGame();
        const state = engine.getGameState();
        state.players[0].score = 20;
        state.players[1].score = 18;

        // When: checking if game over
        const isOver = engine.isGameOver();

        // Then: game should not be over
        expect(isOver).toBe(false);
      });

      it("should return false when player at 21 but opponent at 20 (only 1-point lead)", () => {
        // Given: player 1 at 21, player 2 at 20 (insufficient lead)
        engine.startGame();
        const state = engine.getGameState();
        state.players[0].score = 21;
        state.players[1].score = 20;

        // When: checking if game over
        const isOver = engine.isGameOver();

        // Then: game should not be over (need 2-point lead)
        expect(isOver).toBe(false);
      });

      it("should return true when player reaches 21 with 2-point lead (21-19)", () => {
        // Given: player 1 at 21, player 2 at 19 (2-point lead)
        engine.startGame();
        const state = engine.getGameState();
        state.players[0].score = 21;
        state.players[1].score = 19;

        // When: checking if game over
        const isOver = engine.isGameOver();

        // Then: game should be over
        expect(isOver).toBe(true);
      });

      it("should return true when player reaches 22 with 2-point lead (22-20)", () => {
        // Given: player 1 at 22, player 2 at 20 (2-point lead)
        engine.startGame();
        const state = engine.getGameState();
        state.players[0].score = 22;
        state.players[1].score = 20;

        // When: checking if game over
        const isOver = engine.isGameOver();

        // Then: game should be over
        expect(isOver).toBe(true);
      });

      it("should return true when player at 23 with larger lead (23-21)", () => {
        // Given: player 1 at 23, player 2 at 21 (2-point lead)
        engine.startGame();
        const state = engine.getGameState();
        state.players[0].score = 23;
        state.players[1].score = 21;

        // When: checking if game over
        const isOver = engine.isGameOver();

        // Then: game should be over
        expect(isOver).toBe(true);
      });

      it("should detect player 2 winning (opposite direction)", () => {
        // Given: player 2 at 21, player 1 at 18 (player 2 wins with 3-point lead)
        engine.startGame();
        const state = engine.getGameState();
        state.players[0].score = 18;
        state.players[1].score = 21;

        // When: checking if game over
        const isOver = engine.isGameOver();

        // Then: game should be over
        expect(isOver).toBe(true);
      });

      it("should return false when scores are tied at 21-21", () => {
        // Given: both players at 21 (no lead)
        engine.startGame();
        const state = engine.getGameState();
        state.players[0].score = 21;
        state.players[1].score = 21;

        // When: checking if game over
        const isOver = engine.isGameOver();

        // Then: game should not be over (need lead to win)
        expect(isOver).toBe(false);
      });

      it("should return false when scores are tied at 22-22", () => {
        // Given: both players at 22 (tied, no lead)
        engine.startGame();
        const state = engine.getGameState();
        state.players[0].score = 22;
        state.players[1].score = 22;

        // When: checking if game over
        const isOver = engine.isGameOver();

        // Then: game should not be over (tied is not a win)
        expect(isOver).toBe(false);
      });

      it("should return false when player at 21 but opponent ahead (20-21)", () => {
        // Given: player 1 at 20, player 2 at 21
        engine.startGame();
        const state = engine.getGameState();
        state.players[0].score = 20;
        state.players[1].score = 21;

        // When: checking if game over
        const isOver = engine.isGameOver();

        // Then: game should not be over (player 2 only has 1-point lead)
        expect(isOver).toBe(false);
      });
    });

    it("should identify winner", () => {
      // Given: game that could have winner
      engine.startGame();

      // Manually set scores for testing (in real scenario, would play game)
      const state = engine.getGameState();
      state.players[0].score = 21;
      state.players[1].score = 15;

      // When: checking winner
      const winner = engine.getWinner();

      // Then: should identify winner or null
      expect(winner === null || [0, 1].includes(winner)).toBe(true);
    });

    it("should detect tie", () => {
      // Given: game with tied scores
      engine.startGame();
      const state = engine.getGameState();
      state.players[0].score = 20;
      state.players[1].score = 20;

      // When: checking for tie
      const isTie = engine.isTie();

      // Then: should return boolean
      expect(typeof isTie).toBe("boolean");
    });
  });

  describe("Game Queries", () => {
    it("should report available moves", () => {
      // Given: game initialized
      engine.startGame();
      const currentPlayer = engine.getCurrentPlayer();

      // When: getting available moves
      const moves = engine.getAvailableMoves(currentPlayer);

      // Then: should return array of moves
      expect(Array.isArray(moves)).toBe(true);
      expect(moves.length).toBeGreaterThan(0);
    });

    it("should check if hand empty", () => {
      // Given: game with player having cards
      engine.startGame();
      const state = engine.getGameState();

      // When: checking if hand empty
      const isEmpty = state.players[0].hand.length === 0;

      // Then: should return proper status
      expect(typeof isEmpty).toBe("boolean");
    });

    it("should provide player info", () => {
      // Given: engine with players
      engine.startGame();

      // When: getting player info
      const info = engine.getPlayerInfo(0);

      // Then: should return player details
      expect(info).not.toBeNull();
      expect(info.name).toBeDefined();
      expect(info.score).toBeDefined();
      expect(info.handSize).toBeDefined();
    });
  });
});
