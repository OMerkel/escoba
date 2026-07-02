/**
 * Advanced AI Evaluation Heuristics
 * Extends position evaluation with strategic knowledge about Escoba
 *
 * Implements:
 * - Hand composition scoring (flexibility vs. commitment)
 * - Capture sequence analysis (board control, forcing moves)
 * - Endgame detection and evaluation shifts
 * - Forcing sequence detection (threat modeling)
 *
 * Requirement: FR-15.1b (Enhanced Negamax AI strategy)
 * Related to: Hand composition, board dynamics, endgame nuances
 */

/**
 * Score hand flexibility: count cards that can capture from table
 * Higher = more options available (good for position)
 *
 * @param {Object[]} hand - Current player's hand
 * @param {Object[]} tableCards - Cards on table
 * @returns {number} Flexibility score
 */
export function scoreHandFlexibility(hand, tableCards) {
  if (!hand || hand.length === 0) return 0;
  if (!tableCards || tableCards.length === 0) return 0;

  let flexibilityCount = 0;
  for (const card of hand) {
    // Count how many table cards match this card's value
    const matches = tableCards.filter((tc) => tc.value === card.value);
    if (matches.length > 0) {
      flexibilityCount++;
    }
  }

  // Scale: 0.5 points per flexible card
  return flexibilityCount * 0.5;
}

/**
 * Score hand commitment: penalize cards with no options
 * Negative score = forced to play specific cards (bad for position)
 *
 * @param {Object[]} hand - Current player's hand
 * @param {Object[]} tableCards - Cards on table
 * @returns {number} Commitment penalty (negative)
 */
export function scoreHandCommitment(hand, tableCards) {
  if (!hand || hand.length === 0) return 0;
  if (!tableCards || tableCards.length === 0) return -hand.length * 0.3;

  const unplayable = hand.filter(
    (h) => !tableCards.some((tc) => tc.value === h.value),
  );
  // Penalty: -0.3 per unplayable card (forced plays are weak)
  return -unplayable.length * 0.3;
}

/**
 * Score capture sequence potential
 * Bonus if my remaining hand can capture from table after this move
 *
 * @param {Object} move - Move to evaluate {card, isCapture, capturedCards}
 * @param {Object[]} hand - Current player's hand
 * @param {Object[]} tableCards - Cards on table
 * @returns {number} Sequence potential bonus
 */
export function scoreSequentialCaptures(move, hand, tableCards) {
  if (!move?.isCapture) return 0;
  if (!move?.capturedCards?.length) return 0;

  // What's left on table after this capture?
  const remainingTable = tableCards.filter(
    (tc) =>
      !move.capturedCards.some(
        (cc) => cc.value === tc.value && cc.suit === tc.suit,
      ),
  );

  if (remainingTable.length === 0) {
    // I just cleared the table (escoba) - massive bonus for control
    return 20.0; // Scaled up from 3.0
  }

  // Count cards in my hand that can capture from new table
  // (excluding the card I just played)
  const followUpCaptures = hand.filter(
    (h) =>
      h.value !== move.card.value &&
      remainingTable.some((t) => t.value === h.value),
  ).length;

  // Bonus: +5.0 per follow-up capture opportunity (scaled up from +1.0)
  return followUpCaptures * 5.0;
}

/**
 * Detect if game is in endgame phase
 * Endgame = deck nearly exhausted, table dynamics matter more
 *
 * @param {Object} gameState - Current game state
 * @returns {boolean}
 */
export function isEndgame(gameState) {
  if (!gameState?.deck) return false;

  // Endgame when deck has 6 or fewer cards remaining
  const deckSize = gameState.deck?.cards?.length || 0;
  return deckSize <= 6;
}

/**
 * Evaluate position with endgame adjustments
 * In endgame, priorities shift: escobas matter more, final card is crucial
 *
 * @param {Object} position - Base evaluation score
 * @param {Object} move - Move being evaluated
 * @param {Object} gameState - Current game state
 * @returns {number} Adjusted evaluation
 */
export function evaluateEndgamePosition(position, move, gameState) {
  if (!isEndgame(gameState)) {
    return position;
  }

  // In endgame, we care about:
  // 1. Escobas (clearing table = opponent gets nothing)
  // 2. Final card advantage (who gets last play?)
  // 3. Avoiding splits that help opponent

  let endgameBonus = 0;

  if (move?.isCapture && move.capturedCards) {
    // Escoba bonus: if we clear table, significant advantage
    if (move.capturedCards.length > 2) {
      endgameBonus += 1.5;
    }

    // Bonus for capturing high-value cards in endgame (7-oros, face cards)
    const highValueCaptures = move.capturedCards.filter(
      (c) => c.value > 5 || (c.rank === "7" && c.suit === "oros"),
    ).length;
    endgameBonus += highValueCaptures * 0.5;
  }

  return position + endgameBonus;
}

/**
 * Detect forcing moves (opponent has limited/bad options)
 * Returns bonus if my move severely restricts opponent's choices
 *
 * @param {Object} move - Move being evaluated
 * @param {Object[]} opponentMoves - Available moves for opponent after my move
 * @returns {number} Forcing move bonus
 */
export function scoreForcing(move, opponentMoves) {
  void move;
  if (!opponentMoves || opponentMoves.length === 0) {
    // Opponent has no legal moves - I must have forced endgame
    return 10.0; // Scaled up from 2.0
  }

  if (opponentMoves.length === 1) {
    // Opponent forced to single move - strong forcing
    return 7.5; // Scaled up from 1.5
  }

  // If all opponent moves are captures, they're forced to attack
  // (vs. having flexibility to build)
  const allCaptures = opponentMoves.every((m) => m.isCapture);
  if (allCaptures && opponentMoves.length <= 2) {
    return 4.0; // Scaled up from 0.8
  }

  return 0;
}

/**
 * Comprehensive strategic evaluation
 * Combines base position score with hand composition, sequence potential, endgame, forcing
 *
 * @param {number} baseScore - Base evaluation from score difference
 * @param {Object} move - Move being evaluated (can be null)
 * @param {Object[]} hand - Current player's hand
 * @param {Object[]} tableCards - Table cards
 * @param {Object} gameState - Full game state
 * @param {Object[]} opponentMoves - Available opponent moves after our move
 * @returns {number} Strategic evaluation score
 */
export function evaluatePositionStrategic(
  baseScore,
  move,
  hand,
  tableCards,
  gameState,
  opponentMoves = [],
) {
  let score = baseScore;

  // 1. Hand composition analysis
  const flexibility = scoreHandFlexibility(hand, tableCards);
  const commitment = scoreHandCommitment(hand, tableCards);
  score += flexibility + commitment;

  // 2. Capture sequence potential
  if (move) {
    const sequenceBonus = scoreSequentialCaptures(move, hand, tableCards);
    score += sequenceBonus;

    // NEW: Card value bonus (7 of Oros, oros, high-value cards)
    const cardValueBonus = scoreCardValue(move);
    score += cardValueBonus;
  }

  // 3. Endgame position adjustment
  if (move && gameState) {
    const endgameScore = evaluateEndgamePosition(0, move, gameState);
    score += endgameScore;
  }

  // 4. Forcing move detection
  if (opponentMoves && opponentMoves.length > 0) {
    const forcingBonus = scoreForcing(move, opponentMoves);
    score += forcingBonus;
  }

  return score;
}

/**
 * Quick estimate of move quality for move ordering
 * Used in alpha-beta pruning to search better moves first
 *
 * @param {Object} move - Move to estimate
 * @param {Object[]} hand - Current hand
 * @param {Object[]} tableCards - Table cards
 * @returns {number} Ordering heuristic (higher = search first)
 */
export function estimateMoveQuality(move, hand, tableCards) {
  let quality = 0;

  if (!move) return quality;

  // Prioritize captures over discards
  if (move.isCapture) {
    quality += 10;

    // Prioritize larger captures (more card removal)
    if (move.capturedCards) {
      quality += move.capturedCards.length * 2;

      // Bonus for escoba (4+ cards)
      if (move.capturedCards.length >= 4) {
        quality += 5;
      }
    }
  }

  // Deprioritize cards with no future options
  if (!move.isCapture && hand && tableCards) {
    const hasOption = tableCards.some((tc) => tc.value === move.card.value);
    if (!hasOption) {
      quality -= 5;
    }
  }

  return quality;
}

/**
 * Score value of captured cards in this move
 * Rewards capturing high-value cards that contribute to scoring
 * 7 of Oros is particularly important - worth 1 point by itself
 *
 * @param {Object} move - Move being evaluated
 * @returns {number} Bonus score for card values
 */
export function scoreCardValue(move) {
  if (!move?.isCapture || !move?.capturedCards) {
    return 0;
  }

  let score = 0;

  // High bonus for 7 of Oros (single point in scoring)
  const has7Oros = move.capturedCards.some(
    (c) => c.rank === "7" && c.suit === "oros",
  );
  if (has7Oros) {
    score += 25.0; // Scaled up from 5.0 to ensure it's captured
  }

  // Bonus for capturing majority of oros (worth 1 point)
  const orosCount = move.capturedCards.filter((c) => c.suit === "oros").length;
  if (orosCount > 0) {
    score += orosCount * 1.0; // Scaled up from 0.2
  }

  // Bonus for high-value cards in general (face cards, 7s)
  const highValueCards = move.capturedCards.filter(
    (c) => c.value >= 10 || c.rank === "7",
  );
  if (highValueCards.length > 0) {
    score += highValueCards.length * 2.0; // Scaled up from 0.3
  }

  return score;
}

/**
 * Explain evaluation for debugging
 * Returns human-readable breakdown of score calculation
 *
 * @param {Object} evaluation - Full evaluation object
 * @returns {string} Formatted explanation
 */
export function explainEvaluation(evaluation) {
  if (!evaluation) return "No evaluation available";

  let explanation = "Position Evaluation:\n";
  explanation += `  Base Score: ${evaluation.baseScore || 0}\n`;
  explanation += `  Hand Flexibility: ${evaluation.flexibility || 0}\n`;
  explanation += `  Hand Commitment: ${evaluation.commitment || 0}\n`;
  explanation += `  Sequence Potential: ${evaluation.sequenceBonus || 0}\n`;
  explanation += `  Endgame Adjustment: ${evaluation.endgameBonus || 0}\n`;
  explanation += `  Forcing Bonus: ${evaluation.forcingBonus || 0}\n`;
  explanation += `  Final Score: ${evaluation.finalScore || 0}\n`;

  return explanation;
}
