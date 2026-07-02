/**
 * AI Manager Module
 * Orchestrates AI strategy selection and asynchronous move execution
 * Requirement: FR-12, FR-15 (AI player support)
 */

import { selectGreedyMove } from "./ai-strategy.js";

/**
 * Select appropriate strategy based on configuration
 * Currently supports: "greedy"
 *
 * @param {Object} config - Game configuration with aiStrategy
 * @returns {Function} Strategy function (hand, tableCards, gameState)
 */
export function selectStrategy(config) {
  const strategy = config?.aiStrategy || "greedy";

  const strategies = {
    greedy: selectGreedyMove,
    // Future: negamax, mcts, etc.
  };

  return strategies[strategy] || strategies.greedy;
}

/**
 * Execute AI move asynchronously with timeout
 * Ensures move completes within configured response time
 *
 * @param {Function} strategy - Strategy function
 * @param {Object[]} hand - Player's hand
 * @param {Object[]} tableCards - Table cards
 * @param {Object} gameState - Current game state
 * @param {Object} config - Configuration with aiResponseTime
 * @returns {Promise<Object>} Selected move {card, capture, isCapture}
 */
export async function executeAIMove(
  strategy,
  hand,
  tableCards,
  gameState,
  config,
) {
  const timeoutMs = config?.aiResponseTime || 3000;

  return new Promise((resolve, reject) => {
    // Set timeout
    const timer = setTimeout(() => {
      reject(new Error(`AI move timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    try {
      // Execute strategy synchronously (can be wrapped for async strategies)
      const move = strategy(hand, tableCards, gameState);
      clearTimeout(timer);
      resolve(move);
    } catch (err) {
      clearTimeout(timer);
      reject(err);
    }
  });
}

/**
 * Validate AI move against game rules
 * Checks: card in hand, capture validity, move legality
 *
 * @param {Object} move - Move to validate
 * @param {Object[]} hand - Player's hand
 * @param {Object[]} tableCards - Table cards
 * @returns {boolean} Move is valid
 */
export function validateAIMove(move, hand, tableCards) {
  if (!move?.card) {
    return false;
  }

  // Check card is in hand
  const cardInHand = hand?.some((c) => c.equals(move.card)) ?? false;
  if (!cardInHand) {
    return false;
  }

  // Check capture validity (if capturing)
  if (move.isCapture && move.capture) {
    // Validate capture cards exist on table
    const allCaptureCardsOnTable = move.capture.every((captureCard) =>
      tableCards.some((tc) => tc.equals(captureCard)),
    );
    if (!allCaptureCardsOnTable) {
      return false;
    }

    // Validate Escoba de Quince rule: hand card + table cards must sum to 15
    const tableSum = move.capture.reduce((sum, c) => sum + c.value, 0);
    if (move.card.value + tableSum !== 15) {
      return false;
    }
  }

  return true;
}

/**
 * Get AI move with strategy selection, execution, and validation
 * Complete pipeline for AI decision-making
 *
 * @param {Object} playerConfig - Player configuration with aiStrategy, aiResponseTime
 * @param {Object[]} hand - Player's hand
 * @param {Object[]} tableCards - Table cards
 * @param {Object} gameState - Current game state
 * @returns {Promise<Object>} Validated AI move
 */
export async function getAIMove(playerConfig, hand, tableCards, gameState) {
  // Select strategy
  const strategy = selectStrategy(playerConfig);

  // Execute move with timeout
  const move = await executeAIMove(
    strategy,
    hand,
    tableCards,
    gameState,
    playerConfig,
  );

  // Validate move
  const isValid = validateAIMove(move, hand, tableCards);
  if (!isValid) {
    throw new Error("AI move failed validation");
  }

  return move;
}

/**
 * AI Manager class for orchestrating AI player moves
 * @class AIManager
 */
export class AIManager {
  constructor(strategy = "greedy", config = {}) {
    this.strategy = strategy;
    this.config = config;
    this.responseTimeLimit = config.aiResponseTime || 5000; // ms
  }

  /**
   * Generate best move for given game state
   * @async
   * @param {GameState} gameState
   * @returns {Promise<Object>} {card: Card, capture: Card[]}
   */
  async generateMove(gameState) {
    void gameState;
    // Placeholder: actual implementation will delegate to strategy
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ card: null, capture: [] });
      }, 100);
    });
  }

  /**
   * Select strategy based on config
   * @param {string} strategyName "greedy" | "negamax" | "mcts"
   * @returns {Function} Strategy function
   */
  selectStrategy(strategyName) {
    return selectStrategy({ aiStrategy: strategyName || this.strategy });
  }
}
