/**
 * Test suite for GameState module
 * Tests: state immutability, phase transitions, FSM correctness
 * Requirement: FR-1.3, FR-9, FR-11 (Game state and configuration)
 */

import { describe, expect, it } from "vitest";
import { GameState } from "../core/game-state.js";

describe("GameState", () => {
  it("should create initial game state", () => {
    const state = new GameState();
    expect(state.phase).toBe("setup");
    expect(state.round).toBe(1);
    expect(state.players).toHaveLength(2);
  });

  it("should be immutable (frozen)", () => {
    const state = new GameState();
    expect(() => {
      state.phase = "playing";
    }).toThrow();
  });

  it("should transition to new phase creating new instance", () => {
    const state1 = new GameState();
    const state2 = state1.transition("dealing");
    expect(state1.phase).toBe("setup");
    expect(state2.phase).toBe("dealing");
    expect(state1).not.toBe(state2);
  });

  it("should track current player correctly", () => {
    const state = new GameState();
    expect(state.currentPlayer.id).toBe("p1");
    expect(state.opponent.id).toBe("p2");
  });

  it("should detect game over state", () => {
    const state = new GameState();
    expect(state.isGameOver).toBe(false);

    const gameOverState = state.transition("gameEnd");
    expect(gameOverState.isGameOver).toBe(true);
  });

  it("should support custom target score", () => {
    const state = new GameState({ targetScore: 11 });
    expect(state.targetScore).toBe(11);
  });

  it("should support different setenta methods", () => {
    const state1 = new GameState({ setentaMethod: "prime" });
    const state2 = new GameState({ setentaMethod: "numerical" });
    expect(state1.setentaMethod).toBe("prime");
    expect(state2.setentaMethod).toBe("numerical");
  });
});
