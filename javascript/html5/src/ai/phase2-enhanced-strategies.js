/**
 * ENDGAME-ENHANCED STRATEGIES
 * Wraps standard strategies with Phase 2 endgame optimizations
 *
 * Purpose: Seamlessly integrate endgame logic into existing strategies
 * Pattern: Try endgame move first, fallback to standard strategy if endgame doesn't apply
 */

import { CaptureEngine } from "../core/capture.js";
import { selectGreedyMove } from "./ai-strategy.js";
import {
  countHighValueCards,
  isCriticalEndgame,
  selectEndgameMove,
} from "./phase2-endgame.js";

/**
 * GREEDY + ENDGAME: Standard greedy with Phase 2 endgame enhancement
 * When in critical endgame (≤12 cards in deck), applies aggressive high-value capture
 * Otherwise plays standard greedy strategy
 *
 * @param {Object[]} hand - Player's hand
 * @param {Object[]} tableCards - Table cards
 * @param {Object} gameState - Current game state
 * @returns {Object} Selected move
 */
export function selectGreedyEndgameMove(hand, tableCards, gameState) {
  if (!hand || hand.length === 0) {
    return null;
  }

  // Try Phase 2 endgame strategy first
  const endgameMove = selectEndgameMove(hand, tableCards, gameState);
  if (endgameMove) {
    return endgameMove;
  }

  // Fall back to standard greedy
  return selectGreedyMove(hand, tableCards, gameState);
}

/**
 * CARD-PRESERVING + ENDGAME: Value-focused strategy with endgame boost
 * Combines card preservation (prioritize high-value captures) with endgame forcing
 *
 * @param {Object[]} hand - Player's hand
 * @param {Object[]} tableCards - Table cards
 * @param {Object} gameState - Current game state
 * @returns {Object} Selected move
 */
export function selectCardPreservingEndgameMove(hand, tableCards, gameState) {
  if (!hand || hand.length === 0) {
    return null;
  }

  let bestMove = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  // Helper: Calculate card rarity/value score
  function cardValueScore(card) {
    let score = 0;

    // Face cards very valuable
    if (
      card.value === 10 ||
      card.rank === "sota" ||
      card.rank === "caballo" ||
      card.rank === "rey"
    ) {
      score += 30;
    } else if (card.value >= 8) {
      score += 15;
    }

    // Oros suit valuable
    if (card.suit === "oros") {
      score += 10;
    }

    // 7 of oros most valuable
    if (card.rank === "7" && card.suit === "oros") {
      score += 50;
    }

    return score;
  }

  const inEndgame = isCriticalEndgame(gameState);

  // Phase 1: Capture high-value cards on table
  for (const card of hand) {
    const captures = CaptureEngine.getValidCaptures(card, tableCards);

    if (captures.length > 0) {
      for (const capture of captures) {
        // Score based on value of cards being captured
        let captureValue = 0;
        for (const capturedCard of capture) {
          captureValue += cardValueScore(capturedCard);
        }

        const isEscoba = capture.length === tableCards.length;
        const move = {
          card,
          capture,
          isCapture: true,
          isEscoba,
        };

        let score = (isEscoba ? 1200 : 200) + captureValue;

        // Endgame boost: aggressive bonuses in critical endgame
        if (inEndgame) {
          const highValueCount = countHighValueCards(capture);
          score += highValueCount * 100; // Much higher endgame bonus
        }

        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }
    }
  }

  // If no capture, discard low-value cards to preserve high-value ones
  if (!bestMove) {
    if (hand && hand.length > 0) {
      let bestDiscard = hand[0];
      let bestDiscardValue = cardValueScore(hand[0]); // Lower is better (we want to discard low-value)

      for (let i = 1; i < hand.length; i++) {
        const value = cardValueScore(hand[i]);
        if (value < bestDiscardValue) {
          bestDiscardValue = value;
          bestDiscard = hand[i];
        }
      }

      bestMove = { card: bestDiscard, isCapture: false };
    } else {
      return null;
    }
  }

  return bestMove;
}

/**
 * MOMENTUM + ENDGAME: Adaptive strategy with endgame aggression
 * In endgame, becomes more aggressive regardless of score position
 *
 * @param {Object[]} hand - Player's hand
 * @param {Object[]} tableCards - Table cards
 * @param {Object} gameState - Current game state
 * @returns {Object} Selected move
 */
export function selectMomentumEndgameMove(hand, tableCards, gameState) {
  if (!hand || hand.length === 0) {
    return null;
  }

  // Calculate score differential
  const player1Score = gameState.players[0].score || 0;
  const player2Score = gameState.players[1].score || 0;
  const currentPlayer = gameState.currentPlayer;
  const myScore = currentPlayer === 0 ? player1Score : player2Score;
  const oppScore = currentPlayer === 0 ? player2Score : player1Score;
  const scoreDiff = myScore - oppScore;

  let bestMove = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  const inEndgame = isCriticalEndgame(gameState);

  // Get base momentum multiplier
  function getMomentumMultiplier() {
    let mult = 1.0;

    if (scoreDiff > 30) {
      mult = 0.5; // Ahead significantly: conservative
    } else if (scoreDiff > 10) {
      mult = 0.8; // Slightly ahead: moderately conservative
    } else if (scoreDiff < -30) {
      mult = 2.0; // Behind significantly: aggressive
    } else if (scoreDiff < -10) {
      mult = 1.5; // Slightly behind: moderately aggressive
    }

    // Endgame boost: become aggressive regardless of score
    if (inEndgame) {
      mult = Math.max(1.3, mult); // At least 1.3x in endgame
    }

    return mult;
  }

  const momentum = getMomentumMultiplier();

  // Evaluate all possible captures
  for (const card of hand) {
    const captures = CaptureEngine.getValidCaptures(card, tableCards);

    if (captures.length > 0) {
      for (const capture of captures) {
        const isEscoba = capture.length === tableCards.length;
        const move = {
          card,
          capture,
          isCapture: true,
          isEscoba,
        };

        let score = 100 * momentum; // Base capture score

        if (isEscoba) {
          score += 1000 * momentum;
        }

        // 7 of oros bonus (adjusted by momentum)
        if (card.rank === "7" && card.suit === "oros") {
          score += 50 * momentum;
        }

        // Card value bonus (adjusted by momentum)
        score += (card.value || 0) * 10 * momentum;

        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }
    }
  }

  // If no capture, select discard based on momentum
  if (!bestMove) {
    if (hand && hand.length > 0) {
      let bestDiscard = hand[0];
      let bestDiscardScore;

      if (scoreDiff < -20) {
        // Behind: try to preserve cards (discard low)
        bestDiscardScore = hand[0].value || 0;
      } else {
        // Normal or ahead: prefer low-value discard
        bestDiscardScore = 11 - (hand[0].value || 0);
      }

      for (let i = 1; i < hand.length; i++) {
        let score;
        if (scoreDiff < -20) {
          score = hand[i].value || 0;
        } else {
          score = 11 - (hand[i].value || 0);
        }

        if (
          (scoreDiff < -20 && score < bestDiscardScore) ||
          (scoreDiff >= -20 && score > bestDiscardScore)
        ) {
          bestDiscardScore = score;
          bestDiscard = hand[i];
        }
      }

      bestMove = { card: bestDiscard, isCapture: false };
    } else {
      return null;
    }
  }

  return bestMove;
}
