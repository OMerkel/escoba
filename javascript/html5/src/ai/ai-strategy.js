/**
 * AI Strategy Module - Greedy Heuristic
 * Implements greedy move selection strategy for AI players
 * Requirement: FR-15.1a (Greedy AI strategy)
 */

import { CaptureEngine } from "../core/capture.js";

/**
 * Evaluate move quality score
 * Higher score = better move
 * Scoring priorities:
 * 1. Escoba (capture all table cards): +1000
 * 2. 7 of oros: +50
 * 3. Other high-value cards: +value
 * 4. Safe discards (low value): +1
 *
 * @param {Object} move - {card, isCapture, isEscoba}
 * @param {Object} gameState - Current game state
 * @returns {number} Quality score
 */
export function evaluateMoveQuality(move, gameState) {
  void gameState;
  if (!move) return 0;

  let score = 0;

  // Escoba bonus (capturing all table cards)
  if (move.isEscoba) {
    score += 1000;
  }

  // Capture bonus
  if (move.isCapture) {
    score += 100;

    // 7 of oros bonus (most valuable single card)
    if (move.card && move.card.rank === "7" && move.card.suit === "oros") {
      score += 50;
    }

    // High-value card bonus
    if (move.card) {
      const cardValue = move.card.value;
      score += cardValue * 10;
    }
  } else {
    // Discard penalty: prefer to discard low-value cards
    if (move.card) {
      const cardValue = move.card.value;
      score += Math.max(0, 11 - cardValue); // Higher for low-value cards (max value is 10)
    }
  }

  return score;
}

/**
 * Get card value (use the value property directly)
 *
 * @param {Object} card - Card object
 * @returns {number} Card value 0-10
 */
function getCardValue(card) {
  if (!card) return 0;
  return card.value || 0;
}

/**
 * Select best move using greedy heuristic
 * Strategy: Evaluate all possible moves and select highest score
 *
 * @param {Object[]} hand - Player's hand
 * @param {Object[]} tableCards - Table cards
 * @param {Object} gameState - Current game state
 * @returns {Object} Selected move {card, capture, escoba}
 */
export function selectGreedyMove(hand, tableCards, gameState) {
  if (!hand || hand.length === 0) {
    return null;
  }

  let bestMove = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  // Evaluate capture moves
  for (const card of hand) {
    const captures = CaptureEngine.getValidCaptures(card, tableCards);

    if (captures.length > 0) {
      // Has valid captures - check all combinations
      for (const capture of captures) {
        const isEscoba = capture.length === tableCards.length;
        const move = {
          card,
          capture,
          isCapture: true,
          isEscoba,
        };

        const score = evaluateMoveQuality(move, gameState);
        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }
    }
  }

  // If no capture found, select best discard
  if (!bestMove) {
    let bestDiscard = hand[0];
    let bestDiscardScore = evaluateMoveQuality(
      { card: hand[0], isCapture: false },
      gameState,
    );

    for (let i = 1; i < hand.length; i++) {
      const move = { card: hand[i], isCapture: false };
      const score = evaluateMoveQuality(move, gameState);
      if (score > bestDiscardScore) {
        bestDiscardScore = score;
        bestDiscard = hand[i];
      }
    }

    bestMove = { card: bestDiscard, isCapture: false };
  }

  return bestMove;
}

/**
 * Prioritize escobas in move list
 * Return true if move results in escoba
 *
 * @param {Object} move - {card, capture, isEscoba}
 * @returns {boolean}
 */
export function prioritizeEscobas(move) {
  return move && move.isEscoba === true;
}

/**
 * Prioritize 7 of oros
 *
 * @param {Object} move - {card, capture, isEscoba}
 * @returns {boolean}
 */
export function prioritizeSevenOfOros(move) {
  return (
    move?.card &&
    move.card.rank === "7" &&
    move.card.suit === "oros" &&
    move.isCapture === true
  );
}

/**
 * Select highest value capture from valid moves
 *
 * @param {Object[]} validMoves - Valid capture moves
 * @returns {Object} Highest value move
 */
export function selectHighestValueCapture(validMoves) {
  if (!validMoves || validMoves.length === 0) {
    return null;
  }

  return validMoves.reduce((best, current) => {
    const bestValue = getCardValue(best.card);
    const currentValue = getCardValue(current.card);
    return currentValue > bestValue ? current : best;
  });
}

/**
 * Select safe discard (lowest value card)
 *
 * @param {Object[]} hand - Player's hand
 * @returns {Object} Lowest value card
 */
export function selectSafeDiscard(hand) {
  if (!hand || hand.length === 0) {
    return null;
  }

  return hand.reduce((lowestCard, current) => {
    const lowestValue = getCardValue(lowestCard);
    const currentValue = getCardValue(current);
    return currentValue < lowestValue ? current : lowestCard;
  });
}
