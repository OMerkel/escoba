/**
 * GameState represents immutable game state with FSM transitions
 *
 * @class GameState
 * Phases: Setup → Dealing → Playing → Redeal → RoundEnd → Scoring → GameEnd
 * Immutable dataclass pattern: all state transitions create new GameState instances
 */

import { DEFAULT_MANDATORY_CAPTURE_DISPLAY_DURATION_MS } from "../config/configuration.js";

export class GameState {
  constructor(config = {}) {
    // Game configuration
    this.targetScore = config.targetScore || 21;
    this.setentaMethod = config.setentaMethod || "prime"; // "prime" | "simplified" | "numerical"
    this.captureDisplayDurationMs =
      config.captureDisplayDurationMs ??
      config.mandatoryCaptureDisplayDurationMs ??
      DEFAULT_MANDATORY_CAPTURE_DISPLAY_DURATION_MS;
    this.enableFinalCardEscoba = config.enableFinalCardEscoba ?? false;

    // Phase management
    this.phase = config.phase || "setup"; // setup | dealing | playing | captureDisplay | redeal | roundEnd | scoring | gameEnd
    this.round = config.round || 1;

    // Players
    this.players = config.players || [
      { id: "p1", name: "Player 1", score: 0, hand: [], pile: [] },
      { id: "p2", name: "Player 2", score: 0, hand: [], pile: [] },
    ];
    this.currentPlayerIndex = config.currentPlayerIndex || 0;
    this.dealerIndex = Number.isInteger(config.dealerIndex)
      ? config.dealerIndex === 0
        ? 0
        : 1
      : 1;

    // Table state
    this.tableCards = config.tableCards || [];
    this.deck = config.deck || null;

    // Turn state
    this.lastCapture = null; // For escoba detection
    this.moveHistory = config.moveHistory || [];

    // Capture display state (for FR-UI-1)
    this.captureDisplay = config.captureDisplay || null; // { playedCard, tableCards, playerId }

    // Statistics
    this.stats = config.stats || {
      escobas: [0, 0],
      cardsCaptured: [[], []],
      totalEscobas: 0,
    };

    Object.freeze(this);
  }

  /**
   * Transition to new phase with new state
   * @param {string} newPhase
   * @param {Object} updates
   * @returns {GameState}
   */
  transition(newPhase, updates = {}) {
    return new GameState({
      ...this,
      phase: newPhase,
      ...updates,
    });
  }

  /**
   * Get current player
   * @returns {Object} Current player object
   */
  get currentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  /**
   * Get opponent player
   * @returns {Object} Other player object
   */
  get opponent() {
    const opponentIndex = 1 - this.currentPlayerIndex;
    return this.players[opponentIndex];
  }

  /**
   * Check if game is over
   * @returns {boolean}
   */
  get isGameOver() {
    return this.phase === "gameEnd";
  }

  /**
   * Get winner (if game is over)
   * @returns {Object|null} Winner object or null
   */
  get winner() {
    if (!this.isGameOver) return null;
    return this.players[0].score >= this.targetScore
      ? this.players[0]
      : this.players[1];
  }
}
