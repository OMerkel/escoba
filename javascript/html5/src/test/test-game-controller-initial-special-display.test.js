/**
 * Tests FR-10.1/FR-10.2 integration with FR-UI-1.1 mandatory capture display.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Card } from "../core/card.js";
import { DealingEngine } from "../core/dealing.js";
import { Deck } from "../core/deck.js";
import { GameController } from "../ui/game-controller.js";
import { EventBus } from "../utils/event-bus.js";

function createGameViewStub() {
  return {
    currentView: "menu",
    playerTypes: ["human", "ai"],
    clearBoardStatus: vi.fn(),
    render: vi.fn(),
    showMessage: vi.fn(),
    setBoardStatus: vi.fn(),
    updateGameBoard: vi.fn(),
    showAIThinking: vi.fn(),
  };
}

describe("GameController opening mandatory capture display", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("shows initial 15-table capture in captureDisplay phase for configured duration", async () => {
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
        new Card("oros", "as", 1),
      ],
      remainingDeck: new Deck([]),
    });

    const gameView = createGameViewStub();
    const controller = new GameController(gameView, new EventBus());

    const startPromise = controller.startNewGame("medium");

    await vi.advanceTimersByTimeAsync(0);

    expect(controller.gameState.phase).toBe("captureDisplay");
    expect(gameView.updateGameBoard).toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(6000);
    await startPromise;

    expect(controller.gameState.phase).toBe("playing");
    expect(controller.gameState.tableCards).toHaveLength(0);
    expect(controller.gameState.players[1].pile).toHaveLength(4);
    expect(gameView.setBoardStatus).toHaveBeenCalledWith(
      expect.stringContaining("Opening mandatory capture"),
      "success",
      false,
    );
  });

  it("syncs selected difficulty to game view for result statistics", async () => {
    const gameView = createGameViewStub();
    const controller = new GameController(gameView, new EventBus());

    await controller.startNewGame("hard");

    expect(controller.selectedDifficulty).toBe("hard");
    expect(gameView.selectedDifficulty).toBe("hard");
  });
});
