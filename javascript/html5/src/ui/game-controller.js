/**
 * Game Controller
 * Orchestrates game flow, AI turns, and UI updates
 */

import { selectGreedyMove } from "../ai/ai-strategy.js";
import {
  selectCardPreservingMove,
  selectMomentumMove,
  selectRiskAverseMove,
} from "../ai/greedy-variants.js";
import {
  createConfiguration,
  DEFAULT_MANDATORY_CAPTURE_DISPLAY_DURATION_MS,
} from "../config/configuration.js";
import { GAME_MESSAGES } from "../config/messages.js";
import { GameEngine } from "../core/game-engine.js";
import { Logger } from "../utils/logger.js";

const logger = new Logger("escoba:game-controller");

export class GameController {
  constructor(gameView, eventBus) {
    this.gameView = gameView;
    this.eventBus = eventBus;
    this.gameEngine = null;
    this.gameState = null;
    this.selectedDifficulty = null;
    this.aiStrategy = null;
    this.gameActive = false;
    this.isAITurn = false;
    this.roundSummaryOpen = false;
    // playerTypes[0] = "human"|"ai", playerTypes[1] = "human"|"ai"
    this.playerTypes = ["human", "ai"];

    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    this.eventBus.on("difficulty-selected", (data) => {
      this.startNewGame(data.difficulty);
    });

    this.eventBus.on("player-move", (data) => {
      this.handlePlayerMove(data.cards);
    });

    this.eventBus.on("new-game-requested", (data) => {
      this.startNewGame(data.difficulty);
    });
  }

  /**
   * Get capture display duration from config
   */
  getCaptureDisplayDuration() {
    return (
      this.gameState?.captureDisplayDurationMs ||
      DEFAULT_MANDATORY_CAPTURE_DISPLAY_DURATION_MS
    );
  }

  /**
   * Keep Escoba celebration visible before follow-up messages replace it.
   */
  async pauseForEscobaToast() {
    await new Promise((resolve) => setTimeout(resolve, 1400));
  }

  /**
   * Start a new game
   */
  async startNewGame(difficulty) {
    logger.info(`Starting new game with difficulty: ${difficulty}`);

    this.selectedDifficulty = difficulty;
    this.aiStrategy = this.getAIStrategy(difficulty);
    const gameConfig = createConfiguration();
    this.gameEngine = new GameEngine(gameConfig);
    this.gameEngine.startGame();
    this.gameState = this.gameEngine.gameState;
    this.gameActive = true;
    this.isAITurn = false;

    logger.info("Game started", this.gameState);

    this.gameView.currentView = "game";
    this.gameView.playerTypes = this.playerTypes;
    this.gameView.clearBoardStatus(false);
    this.gameView.render(this.gameState);

    const p0label = this.playerTypes[0] === "human" ? "You" : "AI";
    const p1label =
      this.playerTypes[1] === "human" ? "You" : `${difficulty} AI`;
    this.gameView.showMessage(`${p0label} vs ${p1label}`, "info");

    const initialSpecial = this.gameEngine.lastInitialSpecialEvent;
    if (initialSpecial) {
      const dealerLabel =
        this.playerTypes[initialSpecial.dealerIndex] === "human"
          ? initialSpecial.dealerIndex === 0
            ? "Human South"
            : "Human North"
          : initialSpecial.dealerIndex === 0
            ? "AI South"
            : "AI North";

      await this.displayInitialMandatoryCapture(initialSpecial, dealerLabel);
    }

    await this._advanceTurn();
  }

  /**
   * Mandatory FR-UI-1.1 preview for FR-10 opening-table 15/30 capture events.
   */
  async displayInitialMandatoryCapture(initialSpecial, dealerLabel) {
    const finalState = this.gameState;
    const previewCards =
      Array.isArray(initialSpecial.tableCards) &&
      initialSpecial.tableCards.length > 0
        ? [...initialSpecial.tableCards]
        : [
            ...(finalState.players[initialSpecial.dealerIndex]?.pile || []),
          ].slice(-initialSpecial.cardsAwarded);

    if (previewCards.length === 0) {
      this.gameView.setBoardStatus(
        GAME_MESSAGES.INITIAL_TABLE_SPECIAL_STATUS(
          initialSpecial.sum,
          dealerLabel,
          initialSpecial.escobas,
        ),
        "info",
      );
      return;
    }

    const previewPlayers = finalState.players.map((player, index) => {
      if (index !== initialSpecial.dealerIndex) return player;
      const keepCount = Math.max(0, player.pile.length - previewCards.length);
      return {
        ...player,
        pile: player.pile.slice(0, keepCount),
      };
    });

    const previewStatus = GAME_MESSAGES.INITIAL_TABLE_SPECIAL_PREVIEW(
      initialSpecial.sum,
      dealerLabel,
      initialSpecial.escobas,
    );

    this.gameState = finalState.transition("captureDisplay", {
      players: previewPlayers,
      tableCards: previewCards,
      captureDisplay: {
        playedCard: null,
        tableCards: previewCards,
        playerId: initialSpecial.dealerIndex,
        statusText: previewStatus,
        statusType: "success",
      },
    });

    this.gameView.setBoardStatus(previewStatus, "success", false);
    this.gameView.updateGameBoard(this.gameState);

    await new Promise((resolve) => {
      setTimeout(resolve, this.getCaptureDisplayDuration());
    });

    this.gameState = finalState.transition("playing", {
      captureDisplay: null,
    });
    this.gameView.setBoardStatus(
      GAME_MESSAGES.INITIAL_TABLE_SPECIAL_STATUS(
        initialSpecial.sum,
        dealerLabel,
        initialSpecial.escobas,
      ),
      "info",
    );
    this.gameView.updateGameBoard(this.gameState);
  }

  /**
   * Get AI strategy function for difficulty
   */
  getAIStrategy(difficulty) {
    const strategies = {
      easy: selectRiskAverseMove,
      medium: selectGreedyMove,
      hard: selectCardPreservingMove,
      challenge: selectMomentumMove,
    };

    return strategies[difficulty] || selectGreedyMove;
  }

  /**
   * Advance to the next turn: dispatch to human input wait or AI execution
   */
  async _advanceTurn() {
    if (!this.gameActive || this.roundSummaryOpen) return;
    const idx = this.gameState.currentPlayerIndex;
    if (this.playerTypes[idx] === "ai") {
      await this.handleAITurn(idx);
    }
    // For human players, we simply wait for "player-move" events
  }

  /**
   * Handle player move (always from the current player's perspective when human)
   */
  async handlePlayerMove(selectedCards) {
    const idx = this.gameState.currentPlayerIndex;

    // Reject if game inactive or it is an AI's turn
    if (
      !this.gameActive ||
      this.isAITurn ||
      this.roundSummaryOpen ||
      this.playerTypes[idx] === "ai"
    ) {
      this.gameView.setBoardStatus(GAME_MESSAGES.INVALID_MOVE_GENERIC, "error");
      return;
    }

    if (!selectedCards || selectedCards.length === 0) {
      this.gameView.setBoardStatus(GAME_MESSAGES.INVALID_MOVE_GENERIC, "error");
      return;
    }

    try {
      const hand = this.gameState.players[idx].hand;
      const tableCards = this.gameState.tableCards;
      let handCard = null;
      const captureCards = [];

      logger.info(
        `Processing ${selectedCards.length} selected cards`,
        selectedCards,
      );
      logger.info(
        `Hand has ${hand.length} cards, table has ${tableCards.length} cards`,
      );

      for (const selected of selectedCards) {
        const cardInHand = hand.find(
          (c) => c.suit === selected.suit && c.rank === selected.rank,
        );
        if (cardInHand) {
          if (handCard) {
            this.gameView.setBoardStatus(
              GAME_MESSAGES.SELECT_ONE_HAND_CARD,
              "error",
            );
            this.gameView.updateGameBoard(this.gameState);
            return;
          }
          handCard = cardInHand;
          logger.info(`Found hand card: ${cardInHand.suit} ${cardInHand.rank}`);
        } else {
          const cardOnTable = tableCards.find(
            (c) => c.suit === selected.suit && c.rank === selected.rank,
          );
          if (cardOnTable) {
            captureCards.push(cardOnTable);
            logger.info(
              `Found table card: ${cardOnTable.suit} ${cardOnTable.rank}`,
            );
          } else {
            logger.error(`Card not found: ${selected.suit} ${selected.rank}.`);
            this.gameView.setBoardStatus(GAME_MESSAGES.CARD_NOT_FOUND, "error");
            this.gameView.updateGameBoard(this.gameState);
            return;
          }
        }
      }

      if (!handCard) {
        this.gameView.setBoardStatus(GAME_MESSAGES.SELECT_HAND_CARD, "error");
        return;
      }

      let moveData;
      if (captureCards.length === 0) {
        moveData = {
          card: handCard,
          isCapture: false,
        };
      } else {
        const tableSum = captureCards.reduce((sum, c) => sum + c.value, 0);
        if (handCard.value + tableSum !== 15) {
          this.gameView.setBoardStatus(
            GAME_MESSAGES.INVALID_CAPTURE_SUM(
              handCard.value,
              tableSum,
              handCard.value + tableSum,
            ),
            "error",
          );
          return;
        }
        const isEscoba = captureCards.length === tableCards.length;
        moveData = {
          card: handCard,
          capture: captureCards,
          isCapture: true,
          isEscoba,
        };
      }

      const previewStatus = this.buildPreviewStatus(handCard, captureCards);
      await this.displayCaptureSet(idx, handCard, captureCards, previewStatus);

      const moveResult = this.gameEngine.playTurn(idx, moveData);

      if (!moveResult.success) {
        this.gameView.setBoardStatus(
          GAME_MESSAGES.INVALID_MOVE_ERROR(moveResult.error),
          "error",
        );
        this.gameView.updateGameBoard(this.gameState);
        return;
      }

      this.gameState = this.gameEngine.gameState;
      this.gameView.setBoardStatus(
        this.buildResolutionStatus(handCard, captureCards, moveResult.escoba),
        moveResult.moveType === "capture" ? "success" : "info",
      );

      if (moveResult.escoba) {
        this.gameView.showMessage(GAME_MESSAGES.ESCOBA_TOAST, "success");
        await this.pauseForEscobaToast();
      }

      if (this.gameEngine.isRoundComplete()) {
        await this.completeRound();
        return;
      }

      this.gameView.updateGameBoard(this.gameState);

      await this._advanceTurn();
    } catch (error) {
      logger.error("Error handling player move", error);
      this.gameView.setBoardStatus(
        GAME_MESSAGES.SYSTEM_ERROR_TRY_AGAIN,
        "error",
      );
    }
  }

  /**
   * Handle AI turn for given player index
   */
  async handleAITurn(playerIdx = 1) {
    if (!this.gameActive) return;

    this.isAITurn = true;

    try {
      await this.gameView.showAIThinking();

      const hand = this.gameState.players[playerIdx].hand;
      const tableCards = this.gameState.tableCards;

      let moveCards = this.aiStrategy(hand, tableCards, this.gameState);
      if (!moveCards?.card) {
        moveCards = {
          card: hand[Math.floor(Math.random() * hand.length)],
          isCapture: false,
        };
      }

      const captureCardsAI = moveCards.capture || [];
      const previewStatus = this.buildPreviewStatus(
        moveCards.card,
        captureCardsAI,
      );
      await this.displayCaptureSet(
        playerIdx,
        moveCards.card,
        captureCardsAI,
        previewStatus,
      );

      const moveResult = this.gameEngine.playTurn(playerIdx, moveCards);

      if (!moveResult.success) {
        logger.warn("AI move failed", moveResult);
        this.gameView.setBoardStatus(
          GAME_MESSAGES.AI_MOVE_INVALID(moveResult.error),
          "error",
        );
        return;
      }

      this.gameState = this.gameEngine.gameState;
      this.gameView.setBoardStatus(
        this.buildResolutionStatus(
          moveCards.card,
          captureCardsAI,
          moveResult.escoba,
        ),
        moveResult.moveType === "capture" ? "success" : "info",
      );

      if (moveResult.escoba) {
        this.gameView.showMessage(GAME_MESSAGES.ESCOBA_TOAST, "success");
        await this.pauseForEscobaToast();
      }

      if (this.gameEngine.isRoundComplete()) {
        this.isAITurn = false;
        await this.completeRound();
        return;
      }

      this.gameView.updateGameBoard(this.gameState);
    } catch (error) {
      logger.error("Error during AI turn", error);
    } finally {
      this.isAITurn = false;
    }

    // Continue if next player is also AI
    await this._advanceTurn();
  }

  /**
   * Complete the round and check for game end
   */
  async completeRound() {
    logger.info("Round complete");

    // Complete the round in game engine
    const roundSummary = this.gameEngine.completeRound();
    this.gameState = this.gameEngine.gameState;

    this.roundSummaryOpen = true;

    const playerLabels = [
      this.playerTypes[0] === "human" ? "Human South" : "AI South",
      this.playerTypes[1] === "human" ? "Human North" : "AI North",
    ];

    await this.gameView.showRoundSummaryOverlay({
      ...roundSummary,
      playerLabels,
    });

    this.roundSummaryOpen = false;

    if (roundSummary.isGameOver) {
      this.endGame(roundSummary.winnerIndex);
      return;
    }

    this.gameEngine.startNextRound();
    this.gameState = this.gameEngine.gameState;
    this.gameView.clearBoardStatus(false);
    this.gameView.currentView = "game";
    this.gameView.render(this.gameState);
    await this._advanceTurn();
  }

  /**
   * End the game
   */
  endGame(winnerIndex = null) {
    logger.info("Game ended");
    this.gameActive = false;

    const p1Score = this.gameState.players[0].score;
    const p2Score = this.gameState.players[1].score;
    let winner = "ai";
    if (winnerIndex === null) {
      winner = p1Score > p2Score ? "player" : "ai";
    } else {
      winner = this.playerTypes[winnerIndex] === "human" ? "player" : "ai";
    }

    this.gameView.currentView = "results";
    this.gameView.renderResults(winner, p1Score, p2Score);
  }

  /**
   * Display move preview on board before executing move
   * @param {number} playerId - Player index
   * @param {Object} card - Played card
   * @param {Array} captureCards - Table cards being captured (empty if discard)
   * @param {string} statusText - Status text shown in table panel during preview
   */
  async displayCaptureSet(playerId, card, captureCards, statusText) {
    // Create capture display state
    const displayState = this.gameState.transition("captureDisplay", {
      captureDisplay: {
        playedCard: card,
        tableCards: captureCards,
        playerId,
        statusText,
        statusType: captureCards.length > 0 ? "success" : "info",
      },
    });

    this.gameState = displayState;
    this.gameView.setBoardStatus(statusText, "info", false);
    this.gameView.updateGameBoard(this.gameState);

    // Wait for display duration
    const duration = this.getCaptureDisplayDuration();
    await new Promise((resolve) => setTimeout(resolve, duration));

    // Transition back to playing phase
    const playingState = this.gameState.transition("playing", {
      captureDisplay: null,
    });
    this.gameState = playingState;
    this.gameView.updateGameBoard(this.gameState);
  }

  /**
   * Build status text for the preview phase
   */
  buildPreviewStatus(handCard, captureCards) {
    if (!captureCards || captureCards.length === 0) {
      return GAME_MESSAGES.PREVIEW_DISCARD(handCard);
    }

    const capturedSum = captureCards.reduce((sum, c) => sum + c.value, 0);
    const total = handCard.value + capturedSum;
    const terms = [handCard.value, ...captureCards.map((c) => c.value)].join(
      " + ",
    );
    const isEscoba = captureCards.length === this.gameState.tableCards.length;

    return isEscoba
      ? GAME_MESSAGES.PREVIEW_ESCOBA(terms, total)
      : GAME_MESSAGES.PREVIEW_CAPTURE(terms, total);
  }

  /**
   * Build status text for resolved move
   */
  buildResolutionStatus(handCard, captureCards, isEscoba) {
    if (!captureCards || captureCards.length === 0) {
      return GAME_MESSAGES.RESOLUTION_DISCARD(handCard);
    }

    const capturedSum = captureCards.reduce((sum, c) => sum + c.value, 0);
    const total = handCard.value + capturedSum;
    const terms = [handCard.value, ...captureCards.map((c) => c.value)].join(
      " + ",
    );
    const base = GAME_MESSAGES.RESOLUTION_CAPTURE(
      captureCards.length,
      terms,
      total,
    );

    return isEscoba ? `${base}${GAME_MESSAGES.RESOLUTION_ESCOBA_SUFFIX}` : base;
  }
}
