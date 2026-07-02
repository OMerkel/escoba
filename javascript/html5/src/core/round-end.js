/**
 * Round End Module
 * Handles end-of-round mechanics: final card awards, score calculation
 * Requirements: FR-7 (Round End), FR-8 (Scoring)
 */

/**
 * Award remaining table cards to the last capturer
 * FR-7.2: Remaining table cards go to last capture maker
 *
 * @param {Card[]} tableCards - Cards remaining on table
 * @param {Object} lastCapturer - Player object to receive cards
 * @returns {Object} Updated player with new pile
 */
export function awardFinalCards(tableCards, lastCapturer) {
  if (!lastCapturer || !Array.isArray(tableCards) || tableCards.length === 0) {
    return lastCapturer;
  }

  return {
    ...lastCapturer,
    pile: [...lastCapturer.pile, ...tableCards],
  };
}

/**
 * Detect if round is complete (stock exhausted, hands played)
 * FR-7.1: Round ends when stock is empty and all cards from current deal are played
 *
 * @param {Object} gameState - Current game state
 * @returns {boolean} True if round should end
 */
export function isRoundComplete(gameState) {
  if (!gameState) return false;

  const { deck, players } = gameState;

  // Stock must be empty
  if (deck && !deck.isEmpty) return false;

  // Both players must have no cards in hand (played their hand)
  if (players && players.length >= 2) {
    const p1HandEmpty = !players[0].hand || players[0].hand.length === 0;
    const p2HandEmpty = !players[1].hand || players[1].hand.length === 0;
    return p1HandEmpty && p2HandEmpty;
  }

  return false;
}

/**
 * Calculate round end result with final card award
 * FR-7: Complete round end sequence
 *
 * @param {Object} config - Round end configuration
 * @param {Card[]} config.tableCards - Remaining table cards
 * @param {Object} config.lastCapturer - Player who made last capture
 * @param {Object} config.gameState - Current game state
 * @returns {Object} Result with updated game state and any final cards awarded
 */
export function executeRoundEnd(config) {
  if (!config?.gameState) {
    return {
      success: false,
      message: "Invalid configuration",
      gameState: config?.gameState,
    };
  }

  const { tableCards = [], lastCapturer, gameState } = config;

  // Award final cards if any remain
  let updatedLastCapturer = lastCapturer;
  let finalCardsAwarded = [];

  if (tableCards.length > 0 && lastCapturer) {
    updatedLastCapturer = awardFinalCards(tableCards, lastCapturer);
    finalCardsAwarded = tableCards;
  }

  return {
    success: true,
    finalCardsAwarded,
    updatedLastCapturer,
    gameState: {
      ...gameState,
      phase: "scoring",
    },
  };
}

/**
 * Handle tie situation (both players with same score at end)
 * FR-11: Special rule handling for ties
 *
 * @param {Object} p1Result - Player 1 round result
 * @param {Object} p2Result - Player 2 round result
 * @returns {Object} Tie info
 */
export function detectTie(p1Result, p2Result) {
  if (!p1Result || !p2Result) return null;

  const p1Score = p1Result.roundScore || 0;
  const p2Score = p2Result.roundScore || 0;

  if (p1Score === p2Score) {
    return {
      isTie: true,
      score: p1Score,
      players: ["player1", "player2"],
    };
  }

  return {
    isTie: false,
    winner: p1Score > p2Score ? "player1" : "player2",
    scores: { player1: p1Score, player2: p2Score },
  };
}
