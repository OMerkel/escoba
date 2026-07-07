/**
 * Phase 2: Endgame Strategic Enhancements
 * Specializes decision-making during critical end-game situations
 *
 * Purpose: Optimize play when deck approaches depletion (~12 cards or fewer)
 * Key insight: When deck is nearly empty, high-value cards become critical
 * because fewer opportunities remain to capture them
 */

import { CaptureEngine } from "../core/capture.js";
import { isScoringEscoba } from "../core/escoba.js";

/**
 * Detect if we're in critical endgame phase
 * Critical endgame = deck has 12 or fewer cards (roughly 4 deals left)
 *
 * @param {Object} gameState - Current game state
 * @returns {boolean} True if in critical endgame
 */
export function isCriticalEndgame(gameState) {
  if (!gameState?.deck?.cards) {
    return false;
  }
  return gameState.deck.cards.length <= 12;
}

/**
 * Evaluate if a capture targets high-value cards
 * High-value = face cards, oros, or 7-of-oros
 *
 * @param {Object[]} capturedCards - Cards being captured
 * @returns {number} High-value card count
 */
export function countHighValueCards(capturedCards) {
  if (!capturedCards || capturedCards.length === 0) return 0;

  let count = 0;
  for (const card of capturedCards) {
    // Face cards (value 10)
    if (card.value === 10) {
      count++;
    }
    // Any oros card
    else if (card.suit === "oros") {
      count++;
    }
    // High value cards (8-9)
    else if (card.value >= 8) {
      count++;
    }
  }
  return count;
}

/**
 * ENDGAME STRATEGY 1: Aggressive High-Value Capture
 * In critical endgame, prioritize capturing any high-value cards on table
 * Rationale: Fewer deals remain, so must secure valuable cards now
 *
 * @param {Object[]} hand - Player's hand
 * @param {Object[]} tableCards - Table cards
 * @param {Object} gameState - Current game state
 * @returns {Object|null} Best move for endgame, or null if strategy doesn't apply
 */
export function endgameHighValueCapture(hand, tableCards, gameState) {
  if (!isCriticalEndgame(gameState)) {
    return null; // Not endgame, defer to other strategies
  }

  let bestMove = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  // Count high-value cards on table
  const highValueOnTable = countHighValueCards(tableCards);
  if (highValueOnTable === 0) {
    return null; // No high-value cards to capture, use other strategy
  }

  // Phase 1: Look for captures including high-value table cards
  for (const card of hand) {
    const captures = CaptureEngine.getValidCaptures(card, tableCards);

    if (captures.length > 0) {
      for (const capture of captures) {
        const highValueCaptured = countHighValueCards(capture);

        if (highValueCaptured > 0) {
          const isEscoba = isScoringEscoba({
            tableCards,
            captureSet: capture,
            remainingHandCount: hand.length - 1,
            remainingDeckCount: gameState?.deck?.cards?.length || 0,
            enableFinalCardEscoba: gameState?.enableFinalCardEscoba ?? false,
          });
          const move = {
            card,
            capture,
            isCapture: true,
            isEscoba,
          };

          // Score based on high-value cards captured
          let score = highValueCaptured * 50; // Heavy bonus per high-value card

          if (isEscoba) {
            score += 200; // Bonus for escoba (but not overwhelming)
          }

          if (score > bestScore) {
            bestScore = score;
            bestMove = move;
          }
        }
      }
    }
  }

  return bestMove;
}

/**
 * ENDGAME STRATEGY 2: Discard Low-Value Cards Early
 * In endgame, prefer to discard extremely low-value cards (1-3)
 * Rationale: Better to play high-value cards now than be forced to discard them later
 *
 * @param {Object[]} hand - Player's hand
 * @param {Object[]} tableCards - Table cards
 * @param {Object} gameState - Current game state
 * @returns {Object|null} Discard move, or null if strategy doesn't apply
 */
export function endgameCardPreservation(hand, tableCards, gameState) {
  if (!isCriticalEndgame(gameState)) {
    return null; // Not endgame
  }

  // Only return discard if we have no capture options (let main strategy handle those)
  if (!hand || hand.length === 0) {
    return null;
  }

  // Check if any captures exist
  let hasCapture = false;
  for (const card of hand) {
    if (CaptureEngine.getValidCaptures(card, tableCards).length > 0) {
      hasCapture = true;
      break;
    }
  }

  if (hasCapture) {
    return null; // Has captures, let main strategy handle
  }

  // No captures - find lowest value card to discard
  let bestDiscard = hand[0];
  let lowestValue = hand[0].value || 10;

  for (let i = 1; i < hand.length; i++) {
    const cardValue = hand[i].value || 10;
    if (cardValue < lowestValue) {
      lowestValue = cardValue;
      bestDiscard = hand[i];
    }
  }

  return { card: bestDiscard, isCapture: false };
}

/**
 * ENDGAME STRATEGY 3: Force Opponent Mistakes
 * In endgame, analyze opponent's hand position and force suboptimal plays
 * Characteristics:
 * - If opponent has few options, take moves that limit them further
 * - Avoid leaving easy captures for opponent
 *
 * @param {Object[]} hand - Player's hand
 * @param {Object[]} tableCards - Table cards
 * @param {Object} gameState - Current game state
 * @returns {Object|null} Best move for forcing, or null if not applicable
 */
export function endgameForcePlay(hand, tableCards, gameState) {
  if (!isCriticalEndgame(gameState)) {
    return null; // Not endgame
  }

  let bestMove = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  // Look for moves that limit opponent options
  for (const card of hand) {
    const captures = CaptureEngine.getValidCaptures(card, tableCards);

    if (captures.length > 0) {
      for (const capture of captures) {
        // If capture removes critical cards from table, it's good
        const tableHasHighValue = countHighValueCards(tableCards) > 0;
        const captureHasHighValue = countHighValueCards(capture) > 0;

        if (tableHasHighValue && captureHasHighValue) {
          const isEscoba = isScoringEscoba({
            tableCards,
            captureSet: capture,
            remainingHandCount: hand.length - 1,
            remainingDeckCount: gameState?.deck?.cards?.length || 0,
            enableFinalCardEscoba: gameState?.enableFinalCardEscoba ?? false,
          });
          const move = {
            card,
            capture,
            isCapture: true,
            isEscoba,
          };

          let score = 100;

          if (isEscoba) {
            score += 500; // High bonus for escoba in endgame
          }

          // Bonus for removing high-value cards from opponent access
          score += countHighValueCards(capture) * 40;

          if (score > bestScore) {
            bestScore = score;
            bestMove = move;
          }
        }
      }
    }
  }

  return bestMove;
}

/**
 * ENDGAME INTEGRATION: Apply endgame strategies
 * Returns best endgame move or null to fallback to standard strategy
 *
 * Priority order:
 * 1. Force play (most aggressive)
 * 2. High-value capture (opportunistic)
 * 3. Card preservation (defensive)
 *
 * @param {Object[]} hand - Player's hand
 * @param {Object[]} tableCards - Table cards
 * @param {Object} gameState - Current game state
 * @returns {Object|null} Best endgame move or null
 */
export function selectEndgameMove(hand, tableCards, gameState) {
  // Try strategies in priority order
  let move = endgameForcePlay(hand, tableCards, gameState);
  if (move) return move;

  move = endgameHighValueCapture(hand, tableCards, gameState);
  if (move) return move;

  move = endgameCardPreservation(hand, tableCards, gameState);
  if (move) return move;

  // No endgame strategy applied
  return null;
}
