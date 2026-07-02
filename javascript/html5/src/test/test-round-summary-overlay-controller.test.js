import { describe, expect, it, vi } from "vitest";
import { GameController } from "../ui/game-controller.js";
import { EventBus } from "../utils/event-bus.js";

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("GameController round summary overlay flow", () => {
  function makeControllerWithMocks() {
    const eventBus = new EventBus();
    const gameView = {
      showRoundSummaryOverlay: vi.fn(),
      clearBoardStatus: vi.fn(),
      render: vi.fn(),
      renderResults: vi.fn(),
      currentView: "game",
      playerTypes: ["human", "ai"],
    };

    const controller = new GameController(gameView, eventBus);
    controller.gameActive = true;
    controller.playerTypes = ["human", "ai"];

    return { controller, gameView };
  }

  it("waits for overlay OK before starting next round", async () => {
    const { controller, gameView } = makeControllerWithMocks();
    const gate = deferred();

    const summary = {
      round: 1,
      categories: [],
      roundPoints: [3, 1],
      previousTotals: [0, 0],
      totals: [3, 1],
      finalTableAward: { cardsAwarded: 0, lastCapturerIndex: null },
      isGameOver: false,
      winnerIndex: null,
    };

    controller.gameEngine = {
      completeRound: vi.fn(() => summary),
      startNextRound: vi.fn(),
      gameState: {
        currentPlayerIndex: 0,
        players: [
          { score: 3, hand: [], pile: [] },
          { score: 1, hand: [], pile: [] },
        ],
        tableCards: [],
      },
    };
    controller.gameState = controller.gameEngine.gameState;

    gameView.showRoundSummaryOverlay.mockReturnValueOnce(gate.promise);

    const completion = controller.completeRound();
    await Promise.resolve();

    expect(controller.roundSummaryOpen).toBe(true);
    expect(controller.gameEngine.startNextRound).not.toHaveBeenCalled();
    expect(gameView.renderResults).not.toHaveBeenCalled();

    gate.resolve();
    await completion;

    expect(controller.roundSummaryOpen).toBe(false);
    expect(controller.gameEngine.startNextRound).toHaveBeenCalledTimes(1);
    expect(gameView.render).toHaveBeenCalled();
  });

  it("waits for overlay OK before ending game", async () => {
    const { controller, gameView } = makeControllerWithMocks();
    const gate = deferred();

    const summary = {
      round: 5,
      categories: [],
      roundPoints: [4, 2],
      previousTotals: [19, 19],
      totals: [23, 21],
      finalTableAward: { cardsAwarded: 2, lastCapturerIndex: 0 },
      isGameOver: true,
      winnerIndex: 0,
    };

    controller.gameEngine = {
      completeRound: vi.fn(() => summary),
      startNextRound: vi.fn(),
      gameState: {
        currentPlayerIndex: 0,
        players: [
          { score: 23, hand: [], pile: [] },
          { score: 21, hand: [], pile: [] },
        ],
        tableCards: [],
      },
    };
    controller.gameState = controller.gameEngine.gameState;

    gameView.showRoundSummaryOverlay.mockReturnValueOnce(gate.promise);

    const completion = controller.completeRound();
    await Promise.resolve();

    expect(gameView.renderResults).not.toHaveBeenCalled();
    expect(controller.gameActive).toBe(true);

    gate.resolve();
    await completion;

    expect(controller.gameEngine.startNextRound).not.toHaveBeenCalled();
    expect(controller.gameActive).toBe(false);
    expect(gameView.currentView).toBe("results");
    expect(gameView.renderResults).toHaveBeenCalledTimes(1);
  });
});
