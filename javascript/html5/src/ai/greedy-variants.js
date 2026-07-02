/**
 * Greedy Strategy Variants
 * Implements specialized Greedy strategies with different tactical approaches
 *
 * Purpose: Create multi-tier AI difficulty system for competitive play
 */

import { CaptureEngine } from "../core/capture.js";

/**
 * RISK-AVERSE GREEDY: Prioritizes safe, guaranteed captures
 * Characteristics:
 * - Strongly prefers escobas (clearing the table)
 * - Avoids leaving high-value cards for opponent
 * - Conservative with 7-of-Oros (only takes when safe)
 * Difficulty: MEDIUM - More predictable, plays defensively
 */
export function selectRiskAverseMove(hand, tableCards, gameState) {
  void gameState;
  if (!hand || hand.length === 0) {
    return null;
  }

  let bestMove = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  // Phase 1: Look for escobas (safest captures)
  for (const card of hand) {
    const captures = CaptureEngine.getValidCaptures(card, tableCards);

    if (captures.length > 0) {
      for (const capture of captures) {
        const isEscoba = capture.length === tableCards.length;

        // Only consider escoba in this phase
        if (isEscoba) {
          const move = {
            card,
            capture,
            isCapture: true,
            isEscoba: true,
          };

          const score = 1000; // Heavy escoba bonus
          if (score > bestScore) {
            bestScore = score;
            bestMove = move;
          }
        }
      }
    }
  }

  // Phase 2: If no escoba, look for multiple-card captures (safer than single)
  if (!bestMove) {
    for (const card of hand) {
      const captures = CaptureEngine.getValidCaptures(card, tableCards);

      if (captures.length > 0) {
        for (const capture of captures) {
          // Prefer captures with 3+ cards (very safe)
          if (capture.length >= 3) {
            const move = {
              card,
              capture,
              isCapture: true,
              isEscoba: false,
            };

            const score = 500 + capture.length * 50; // Bonus for multi-card captures
            if (score > bestScore) {
              bestScore = score;
              bestMove = move;
            }
          }
        }
      }
    }
  }

  // Phase 3: If no multi-card capture, look for any capture
  if (!bestMove) {
    for (const card of hand) {
      const captures = CaptureEngine.getValidCaptures(card, tableCards);

      if (captures.length > 0) {
        for (const capture of captures) {
          const move = {
            card,
            capture,
            isCapture: true,
            isEscoba: false,
          };

          // Value-based scoring but conservative
          let score = 200;

          if (card.rank === "7" && card.suit === "oros") {
            score += 30; // Moderate bonus for 7-oros
          }

          score += card.value * 8; // Slightly lower multiplier for conservatism

          if (score > bestScore) {
            bestScore = score;
            bestMove = move;
          }
        }
      }
    }
  }

  // Phase 4: If no capture, discard safely (low-value first)
  if (!bestMove) {
    if (hand && hand.length > 0) {
      let bestDiscard = hand[0];
      let bestDiscardScore = 11 - (hand[0].value || 0); // Invert: prefer low cards

      for (let i = 1; i < hand.length; i++) {
        const score = 11 - (hand[i].value || 0);
        if (score > bestDiscardScore) {
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

/**
 * CARD-PRESERVING GREEDY: Focuses on securing high-value cards
 * Characteristics:
 * - Aggressively captures high-value cards (face cards, oros)
 * - Strategically discards low-value cards early
 * - Reserves high-value cards in hand when possible
 * Difficulty: HARD - Wins value trades consistently
 */
export function selectCardPreservingMove(hand, tableCards, gameState) {
  void gameState;
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

        const score = (isEscoba ? 1200 : 200) + captureValue;

        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }
    }
  }

  // If no capture, select discard based on card value preservation
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
 * MOMENTUM-BASED GREEDY: Makes decisions based on score situation
 * Characteristics:
 * - When ahead: Conservative, avoids risky plays
 * - When behind: Aggressive, takes calculated risks
 * - Adapts strategy to current game state
 * Difficulty: HARD - Reactive, difficult to predict
 */
export function selectMomentumMove(hand, tableCards, gameState) {
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

  // Helper: Evaluate move aggressiveness based on score
  function getMomentumMultiplier() {
    if (scoreDiff > 30) {
      // Ahead significantly: be very conservative
      return 0.5;
    }
    if (scoreDiff > 10) {
      // Slightly ahead: moderately conservative
      return 0.8;
    }
    if (scoreDiff < -30) {
      // Behind significantly: be very aggressive
      return 2.0;
    }
    if (scoreDiff < -10) {
      // Slightly behind: moderately aggressive
      return 1.5;
    }
    return 1.0; // Tied: normal scoring
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
