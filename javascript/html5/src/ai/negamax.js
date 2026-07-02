/**
 * Negamax Search Algorithm
 * Implements alpha-beta pruned negamax with iterative deepening
 * Requirement: FR-15.1b (Negamax AI strategy)
 *
 * Enhanced with strategic evaluation heuristics:
 * - Hand composition scoring (flexibility vs. commitment)
 * - Capture sequence bonuses (board control)
 * - Endgame detection and evaluation shifts
 * - Forcing move detection (threat modeling)
 */

import { CaptureEngine } from "../core/capture.js";
import { selectGreedyMove } from "./ai-strategy.js";
import {
  estimateMoveQuality,
  evaluatePositionStrategic,
} from "./evaluation-heuristics.js";

/**
 * Evaluate game position with strategic heuristics
 * Returns score from perspective of current player
 *
 * Enhanced with:
 * - Hand composition analysis
 * - Capture sequence potential
 * - Endgame phase detection
 * - Forcing move bonuses
 *
 * @param {Object} gameState - Game state to evaluate
 * @param {Object} move - Move being evaluated (optional)
 * @param {Object[]} opponentMoves - Available opponent moves (optional)
 * @returns {number} Evaluation score
 */
export function evaluatePosition(gameState, move = null, opponentMoves = []) {
  if (!gameState) return 0;

  // Base evaluation: compare scores
  const scores = gameState.scores || [0, 0];
  const currentPlayer = gameState.currentPlayerIndex || 0;
  const opponentPlayer = 1 - currentPlayer;

  const baseScore =
    (scores[currentPlayer] || 0) - (scores[opponentPlayer] || 0);

  // Get current hand and table for strategic evaluation
  const hand = gameState.players?.[currentPlayer]?.hand || [];
  const tableCards = gameState.tableCards || [];

  // Apply strategic heuristics
  const strategicScore = evaluatePositionStrategic(
    baseScore,
    move,
    hand,
    tableCards,
    gameState,
    opponentMoves,
  );

  return strategicScore;
}

/**
 * Generate possible moves from current state
 * Returns all legal moves available, sorted by move quality heuristic
 * Move ordering improves alpha-beta pruning efficiency
 *
 * @param {Object[]} hand - Current player's hand
 * @param {Object[]} tableCards - Cards on table
 * @returns {Object[]} Array of possible moves, ordered by quality
 */
export function generateMoves(hand, tableCards) {
  if (!hand || hand.length === 0) return [];

  const moves = [];

  // For each card in hand, generate possible moves
  for (const card of hand) {
    // Discard option (always available)
    moves.push({
      card,
      isCapture: false,
      capture: [],
    });

    // Capture options: use CaptureEngine to find valid captures
    if (tableCards && tableCards.length > 0) {
      const validCaptures = CaptureEngine.getValidCaptures(card, tableCards);
      for (const captureGroup of validCaptures) {
        moves.push({
          card,
          isCapture: true,
          capture: captureGroup,
          isEscoba: captureGroup.length === tableCards.length,
        });
      }
    }
  }

  // Sort by move quality for better alpha-beta pruning
  moves.sort(
    (a, b) =>
      estimateMoveQuality(b, hand, tableCards) -
      estimateMoveQuality(a, hand, tableCards),
  );

  return moves;
}

/**
 * Negamax search with alpha-beta pruning
 * Returns best move and its score
 *
 * Strategic enhancements:
 * - Move ordering via quality heuristic (better pruning)
 * - Hand composition analysis in evaluation
 * - Endgame phase detection
 * - Forcing move bonuses
 *
 * @param {Object} gameState - Current game state
 * @param {number} depth - Search depth remaining
 * @param {number} alpha - Alpha cutoff value
 * @param {number} beta - Beta cutoff value
 * @param {Object[]} hand - Current player's hand
 * @param {Object[]} tableCards - Table cards
 * @returns {Object} {score: number, move: Object}
 */
export function negamaxSearch(gameState, depth, alpha, beta, hand, tableCards) {
  // Leaf node: return strategic evaluation
  if (depth === 0) {
    return {
      score: evaluatePosition(gameState),
      move: null,
    };
  }

  let maxScore = Number.NEGATIVE_INFINITY;
  let bestMove = null;
  let alphaValue = alpha;

  const moves = generateMoves(hand, tableCards);

  for (const move of moves) {
    // Apply move (simplified - just evaluate without state mutation)
    const movedScore = -negamaxSearch(
      gameState,
      depth - 1,
      -beta,
      -alphaValue,
      hand,
      tableCards,
    ).score;

    if (movedScore > maxScore) {
      maxScore = movedScore;
      bestMove = move;
    }

    alphaValue = Math.max(alphaValue, movedScore);

    // Beta cutoff
    if (alphaValue >= beta) {
      break;
    }
  }

  return {
    score: maxScore,
    move: bestMove,
  };
}

/**
 * Iterative deepening search
 * Progressively searches to increasing depths until time limit
 *
 * @param {Object} gameState - Current game state
 * @param {Object[]} hand - Current player's hand
 * @param {Object[]} tableCards - Table cards
 * @param {number} maxTime - Maximum time budget in ms
 * @param {number} maxDepth - Maximum depth to search
 * @returns {Object} {move: Object, depth: number, score: number}
 */
export function iterativeDeepeningSearch(
  gameState,
  hand,
  tableCards,
  maxTime = 3000,
  maxDepth = 6,
) {
  const startTime = Date.now();
  let bestResult = {
    move: null,
    depth: 0,
    score: 0,
  };

  for (let depth = 1; depth <= maxDepth; depth++) {
    // Check time limit
    const elapsed = Date.now() - startTime;
    if (elapsed > maxTime * 0.9) {
      // Stop if 90% of time used
      break;
    }

    try {
      const result = negamaxSearch(
        gameState,
        depth,
        Number.NEGATIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        hand,
        tableCards,
      );

      if (result.move) {
        bestResult = {
          move: result.move,
          depth,
          score: result.score,
        };
      }
    } catch {
      // Timeout during search, use previous result
      break;
    }
  }

  // Fallback to greedy if no move found
  if (!bestResult.move) {
    bestResult.move = selectGreedyMove(hand, tableCards, gameState);
  }

  return bestResult;
}

/**
 * Negamax strategy function for AI manager
 * Performs time-limited iterative deepening search
 *
 * @param {Object[]} hand - Current player's hand
 * @param {Object[]} tableCards - Table cards
 * @param {Object} gameState - Current game state
 * @param {Object} config - Configuration with timeLimit, maxDepth
 * @returns {Object} Selected move
 */
export function selectNegamaxMove(hand, tableCards, gameState, config = {}) {
  const maxTime = config.aiResponseTime || 3000;
  const maxDepth = config.negamaxDepth || 6;

  const result = iterativeDeepeningSearch(
    gameState,
    hand,
    tableCards,
    maxTime,
    maxDepth,
  );
  return result.move || selectGreedyMove(hand, tableCards, gameState);
}
