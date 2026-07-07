/**
 * AI Baseline Strategy - Neutral for Clean Tournament
 *
 * Purpose: Transparent, minimal AI strategy for reproducible tournaments
 * All difficulty levels use identical core logic, differentiated only by:
 * - Move evaluation pause (easy: longer, hard: shorter)
 * - Random choice tie-breaking (all difficulties deterministic on same board)
 *
 * This is NOT optimized. It's a scientific control baseline.
 * Rationale for each weight documented inline.
 *
 * Status: NEUTRAL BASELINE FOR EXPERIMENTAL VALIDATION
 * Date Created: 2026-06-26
 * Previous assumptions: See doc/AI_ASSUMPTIONS.md
 */

import { CaptureEngine } from "../core/capture.js";
import { isScoringEscoba } from "../core/escoba.js";

/**
 * NEUTRAL BASELINE: Simple, transparent move evaluation
 *
 * Heuristic priorities (in order):
 * 1. Escoba (capture all table cards) - ALWAYS best, guarantees next turn
 * 2. Any valid capture - GOOD, secures cards from opponent
 * 3. Discard (low-value preferred) - NECESSARY when no captures
 *
 * No hand-tuned coefficients. Weights are game-theoretically justified.
 *
 * @param {Object[]} hand - Player's hand
 * @param {Object[]} tableCards - Table cards
 * @param {Object} gameState - Current game state
 * @returns {Object} Selected move {card, capture?, isCapture, isEscoba}
 */
export function selectBaselineMove(hand, tableCards, gameState) {
  if (!hand || hand.length === 0) {
    return null;
  }

  const escobaMoves = [];
  const captureMoves = [];

  // Evaluate all possible moves
  for (const card of hand) {
    const captures = CaptureEngine.getValidCaptures(card, tableCards);

    if (captures.length > 0) {
      // This card can capture
      for (const capture of captures) {
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
          quality: 0, // Placeholder, filled below
        };

        if (isEscoba) {
          // TIER 1: Escoba is always best (clears table, guarantees next move)
          move.quality = 1000;
          escobaMoves.push(move);
        } else {
          // TIER 2: Regular captures are good
          // Quality = base capture value + number of cards captured
          // Rationale: Capturing multiple cards is safer (removes opponent options)
          move.quality = 100 + capture.length;
          captureMoves.push(move);
        }
      }
    }
  }

  // Select best from highest tier available
  if (escobaMoves.length > 0) {
    // Pick first escoba (all equally good at 1000)
    return escobaMoves[0];
  }

  if (captureMoves.length > 0) {
    // Pick capture with highest quality
    captureMoves.sort((a, b) => b.quality - a.quality);
    return captureMoves[0];
  }

  // TIER 3: No captures available, must discard
  // Prefer to discard low-value cards (preserves hand flexibility)
  // Rationale: Keep high-value cards for future capture opportunities
  let bestDiscard = hand[0];
  let lowestValue = hand[0].value || 0;

  for (let i = 1; i < hand.length; i++) {
    const cardValue = hand[i].value || 0;
    if (cardValue < lowestValue) {
      lowestValue = cardValue;
      bestDiscard = hand[i];
    }
  }

  return {
    card: bestDiscard,
    isCapture: false,
    isEscoba: false,
    quality: 0,
  };
}

/**
 * Baseline AI for all difficulty levels
 * Differences are purely UI/UX (thinking time), not algorithm
 *
 * @param {Object[]} hand - Player's hand
 * @param {Object[]} tableCards - Table cards
 * @param {Object} gameState - Current game state
 * @returns {Object} Move
 */
export function selectEasyBaselineMove(hand, tableCards, gameState) {
  // Easy = Same algorithm, just with simulated thinking delay in UI
  return selectBaselineMove(hand, tableCards, gameState);
}

export function selectMediumBaselineMove(hand, tableCards, gameState) {
  // Medium = Same algorithm
  return selectBaselineMove(hand, tableCards, gameState);
}

export function selectHardBaselineMove(hand, tableCards, gameState) {
  // Hard = Same algorithm
  return selectBaselineMove(hand, tableCards, gameState);
}

export function selectChallengeBaselineMove(hand, tableCards, gameState) {
  // Challenge = Same algorithm
  return selectBaselineMove(hand, tableCards, gameState);
}

/**
 * Meta-information about this baseline
 */
export const BASELINE_INFO = {
  name: "Neutral Baseline",
  version: "1.0",
  created: "2026-06-26",
  purpose: "Reproducible tournament control",
  weights: {
    escoba: 1000,
    capture_base: 100,
    capture_multiplier_per_card: 1,
    discard_preference: "lowest_value",
  },
  notes: [
    "All difficulty levels use identical algorithm",
    "Differences (if any) should be UI only (thinking time)",
    "Deterministic: same board state → same move",
    "No hand-tuned coefficients",
    "Suitable for clean tournament baseline",
  ],
};
