/**
 * Game Engine - Central Game Orchestrator
 * Coordinates all game components: rules, AI, turns, rounds, scoring
 * Requirement: FR-2, FR-3, FR-6 (Game flow, turn management, round management)
 */

import { getAIMove } from "../ai/ai-manager.js";
import { CaptureEngine } from "./capture.js";
import { DealingEngine } from "./dealing.js";
import { Deck } from "./deck.js";
import { GameState } from "./game-state.js";
import { ScoringEngine } from "./scoring.js";

/**
 * GameEngine orchestrates complete game flow
 * @class GameEngine
 */
export class GameEngine {
  /**
   * Initialize game engine
   *
   * @param {Object} config - Game configuration
   */
  constructor(config = {}) {
    // Normalize players to objects if they're strings
    const normalizedConfig = {
      ...config,
      players: config.players
        ? config.players.map((p, i) =>
            typeof p === "string"
              ? {
                  id: `p${i + 1}`,
                  name: p,
                  score: 0,
                  hand: [],
                  pile: [],
                }
              : p,
          )
        : undefined,
    };

    this.config = normalizedConfig;
    this.gameState = new GameState(normalizedConfig);
    this.moveHistory = [];
    this.currentRound = 0;
    this.deck = null;
    this.lastRoundSummary = null;
    this.lastInitialSpecialEvent = null;
  }

  /**
   * Start new game
   * Deal initial hands and set up game
   */
  startGame() {
    // Create and shuffle deck
    this.deck = new Deck().shuffle();

    // Deal cards using DealingEngine
    const dealResult = DealingEngine.initialDeal(this.deck);

    // Create players with dealt cards
    const players = [
      {
        id: "p1",
        name: this.config.players?.[0]?.name || "Player 1",
        score: this.gameState?.players[0]?.score || 0,
        hand: dealResult.p1Hand,
        pile: [],
      },
      {
        id: "p2",
        name: this.config.players?.[1]?.name || "Player 2",
        score: this.gameState?.players[1]?.score || 0,
        hand: dealResult.p2Hand,
        pile: [],
      },
    ];

    // Special initial condition: opening table totals 15 or 30.
    // In that case the dealer immediately captures those table cards and scores
    // 1 escoba (sum 15) or 2 escobas (sum 30), then play starts with empty table.
    const dealerIndex = Number.isInteger(this.config.dealerIndex)
      ? this.config.dealerIndex
      : 1;
    const clampedDealerIndex = dealerIndex === 0 ? 0 : 1;
    const initialTableSum = dealResult.tableCards.reduce(
      (acc, card) => acc + card.value,
      0,
    );
    const specialInitialEscobas =
      initialTableSum === 30 ? 2 : initialTableSum === 15 ? 1 : 0;
    const openingTableCards = [...dealResult.tableCards];

    this.lastInitialSpecialEvent = null;

    if (specialInitialEscobas > 0) {
      players[clampedDealerIndex].pile.push(...openingTableCards);
      this.lastInitialSpecialEvent = {
        sum: initialTableSum,
        escobas: specialInitialEscobas,
        dealerIndex: clampedDealerIndex,
        cardsAwarded: openingTableCards.length,
        tableCards: [...openingTableCards],
      };
    }

    const tableCardsAfterInitialRule =
      specialInitialEscobas > 0 ? [] : openingTableCards;
    const initialEscobas = [0, 0];
    initialEscobas[clampedDealerIndex] = specialInitialEscobas;

    // Create new game state with dealt cards
    this.gameState = new GameState({
      ...this.config,
      players,
      tableCards: tableCardsAfterInitialRule,
      deck: dealResult.remainingDeck,
      phase: "playing",
      currentPlayerIndex: 0,
      stats: {
        escobas: initialEscobas,
        cardsCaptured: [[], []],
        totalEscobas: initialEscobas[0] + initialEscobas[1],
      },
    });

    this.moveHistory = [];
    if (this.currentRound === 0) {
      this.currentRound = 1;
    }

    return this.gameState;
  }

  /**
   * Play turn for player
   * Execute move, handle captures, transition
   *
   * @param {number} playerIndex - Player 0 or 1
   * @param {Object} move - {card, capture?, isCapture, isEscoba}
   * @returns {Object} {success, error?, updatedState}
   */
  playTurn(playerIndex, move) {
    try {
      // Validate it's player's turn
      if (this.gameState.currentPlayerIndex !== playerIndex) {
        return { success: false, error: "Not your turn" };
      }

      // Validate move
      const hand = this.gameState.players[playerIndex].hand;
      const cardInHand = hand.some((c) => c.equals(move.card));
      if (!cardInHand) {
        return { success: false, error: "Card not in hand" };
      }

      // Update game state with new values
      const newHand = hand.filter((c) => !c.equals(move.card));
      const newPile = [...this.gameState.players[playerIndex].pile];

      // Handle capture if applicable
      let newTableCards = this.gameState.tableCards;
      const newStats = { ...this.gameState.stats };
      let moveType = "discard"; // Default to discard
      let isEscoba = false;

      if (move.isCapture && move.capture) {
        // Validate capture: Escoba de Quince rule - hand card + table cards must sum to 15
        const tableSum = move.capture.reduce((sum, c) => sum + c.value, 0);
        if (move.card.value + tableSum !== 15) {
          return {
            success: false,
            error: `Invalid capture! Hand card (${move.card.value}) + table cards (${tableSum}) must equal 15`,
          };
        }

        // Add to captured pile
        newPile.push(move.card);
        newPile.push(...move.capture);

        // Remove from table
        newTableCards = this.gameState.tableCards.filter(
          (tc) => !move.capture.some((c) => c.equals(tc)),
        );

        // Check for escoba
        if (move.isEscoba) {
          newStats.escobas[playerIndex] += 1;
          isEscoba = true;
        }

        moveType = "capture"; // This was a capture move
      } else {
        // Discard: add to table
        newTableCards = [...this.gameState.tableCards, move.card];
      }

      // Record move
      this.moveHistory.push({
        round: this.currentRound,
        player: playerIndex,
        move,
        timestamp: Date.now(),
      });

      // Check if both players' hands are empty
      const bothHandsEmpty =
        newHand.length === 0 &&
        this.gameState.players[1 - playerIndex].hand.length === 0;

      // Check if round will complete after this move
      const roundWillComplete =
        bothHandsEmpty &&
        (!this.gameState.deck || this.gameState.deck.cards.length === 0);

      // Update players array with new hand and pile
      let updatedPlayers = this.gameState.players.map((p, i) =>
        i === playerIndex ? { ...p, hand: newHand, pile: newPile } : p,
      );

      // If both hands are empty but deck has cards, deal new hands
      let nextPlayerIndex = 1 - playerIndex;
      if (
        bothHandsEmpty &&
        this.gameState.deck &&
        this.gameState.deck.cards.length > 0
      ) {
        const deck = this.gameState.deck;
        const newHands = [[], []];

        // Deal 3 cards to player 0
        for (let i = 0; i < 3 && deck.cards.length > 0; i++) {
          newHands[0].push(deck.cards.pop());
        }

        // Deal 3 cards to player 1
        for (let i = 0; i < 3 && deck.cards.length > 0; i++) {
          newHands[1].push(deck.cards.pop());
        }

        // Update players with newly dealt cards
        updatedPlayers = updatedPlayers.map((p, i) => ({
          ...p,
          hand: newHands[i],
        }));

        // Next player is whoever would normally play after current player
        nextPlayerIndex = 1 - playerIndex;
      } else if (roundWillComplete) {
        nextPlayerIndex = playerIndex; // End of round marker
      } else {
        nextPlayerIndex = 1 - playerIndex;
      }

      // Create new game state for immutability
      this.gameState = new GameState({
        ...this.config,
        players: updatedPlayers,
        tableCards: newTableCards,
        deck: this.gameState.deck,
        phase: this.gameState.phase,
        currentPlayerIndex: nextPlayerIndex,
        stats: newStats,
      });

      return {
        success: true,
        moveType,
        escoba: isEscoba,
        updatedState: this.gameState,
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Execute AI turn
   * AI selects move asynchronously
   *
   * @param {number} playerIndex - Player index
   * @returns {Promise<Object>} {success, error?, move}
   */
  async playAITurn(playerIndex) {
    try {
      // Validate it's AI's turn
      if (this.gameState.currentPlayerIndex !== playerIndex) {
        return { success: false, error: "Not AI's turn" };
      }

      // Get AI move
      const playerConfig = this.config;
      const hand = this.gameState.players[playerIndex].hand;
      const tableCards = this.gameState.tableCards;

      const aiMove = await getAIMove(
        playerConfig,
        hand,
        tableCards,
        this.gameState,
      );

      // Execute move
      return this.playTurn(playerIndex, aiMove);
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Complete current round
   * Award final cards, score, prepare next round
   */
  completeRound() {
    const stateBeforeScoring = this.gameState;

    // Final table cards go to last capturer (not an escoba)
    const lastCaptureMove = [...this.moveHistory]
      .reverse()
      .find((m) => m?.move?.isCapture);
    const lastCapturerIndex =
      typeof lastCaptureMove?.player === "number"
        ? lastCaptureMove.player
        : null;

    const playersForScoring = this.gameState.players.map((player) => ({
      ...player,
      pile: [...(player.pile || [])],
    }));

    const finalTableCards = [...(this.gameState.tableCards || [])];
    if (lastCapturerIndex !== null && finalTableCards.length > 0) {
      playersForScoring[lastCapturerIndex].pile.push(...finalTableCards);
    }

    // Calculate scores based on captured cards in round piles
    const pile0 = playersForScoring[0].pile;
    const pile1 = playersForScoring[1].pile;

    const roundScores = [0, 0];
    const breakdown = [];

    // 1. Score cards (majority of 40 cards total)
    const cardsScore = ScoringEngine.scoreCards(pile0.length, pile1.length);
    roundScores[0] += cardsScore.p1;
    roundScores[1] += cardsScore.p2;
    breakdown.push({
      key: "cards",
      label: "Captured Cards",
      raw: [pile0.length, pile1.length],
      points: [cardsScore.p1, cardsScore.p2],
    });

    // 2. Score oros (majority of oros captured)
    const oros0 = pile0.filter((c) => c.suit === "oros").length;
    const oros1 = pile1.filter((c) => c.suit === "oros").length;
    const orosScore = ScoringEngine.scoreOros(oros0, oros1);
    roundScores[0] += orosScore.p1;
    roundScores[1] += orosScore.p2;
    breakdown.push({
      key: "oros",
      label: "Oros",
      raw: [oros0, oros1],
      points: [orosScore.p1, orosScore.p2],
    });

    // 3. Score 7 of Oros (single card, worth 1 point)
    const has7Oros0 = pile0.some((c) => c.suit === "oros" && c.rank === "7");
    const has7Oros1 = pile1.some((c) => c.suit === "oros" && c.rank === "7");
    const sevenOrosScore = ScoringEngine.score7Oros(has7Oros0, has7Oros1);
    roundScores[0] += sevenOrosScore.p1;
    roundScores[1] += sevenOrosScore.p2;
    breakdown.push({
      key: "sevenOros",
      label: "7 of Oros",
      raw: [has7Oros0 ? "yes" : "no", has7Oros1 ? "yes" : "no"],
      points: [sevenOrosScore.p1, sevenOrosScore.p2],
    });

    // 4. Score setenta/prime category using recommended two-player prime method
    const setentaScore = ScoringEngine.scoreSetenta("prime", pile0, pile1);
    const p1Prime = buildPrimeSignature(pile0);
    const p2Prime = buildPrimeSignature(pile1);
    roundScores[0] += setentaScore.p1;
    roundScores[1] += setentaScore.p2;
    breakdown.push({
      key: "setenta",
      label: "Setenta (Prime)",
      raw: [p1Prime.short, p2Prime.short],
      rawFull: [p1Prime.display, p2Prime.display],
      points: [setentaScore.p1, setentaScore.p2],
    });

    // 5. Score escobas (each escoba worth 1 point)
    const escobas0 = this.gameState.stats?.escobas?.[0] || 0;
    const escobas1 = this.gameState.stats?.escobas?.[1] || 0;
    const escobasScore = ScoringEngine.scoreEscobas(escobas0, escobas1);
    roundScores[0] += escobasScore.p1;
    roundScores[1] += escobasScore.p2;
    breakdown.push({
      key: "escobas",
      label: "Escobas",
      raw: [escobas0, escobas1],
      points: [escobasScore.p1, escobasScore.p2],
    });

    // Add round scores to player totals
    const previousTotals = [
      this.gameState.players[0].score || 0,
      this.gameState.players[1].score || 0,
    ];
    const nextTotals = [
      previousTotals[0] + roundScores[0],
      previousTotals[1] + roundScores[1],
    ];

    this.gameState = new GameState({
      ...this.config,
      players: [
        {
          ...playersForScoring[0],
          score: nextTotals[0],
          hand: [],
        },
        {
          ...playersForScoring[1],
          score: nextTotals[1],
          hand: [],
        },
      ],
      tableCards: [],
      deck: this.gameState.deck,
      phase: "scoring",
      currentPlayerIndex: stateBeforeScoring.currentPlayerIndex,
      stats: this.gameState.stats,
    });

    const isGameOver = this.isGameOver();
    if (isGameOver) {
      this.gameState = this.gameState.transition("gameEnd");
    }

    const winnerIndex = isGameOver ? this.getWinner() : null;
    this.lastRoundSummary = {
      round: this.currentRound,
      categories: breakdown,
      roundPoints: roundScores,
      previousTotals,
      totals: nextTotals,
      finalTableAward: {
        cardsAwarded: finalTableCards.length,
        lastCapturerIndex,
      },
      isGameOver,
      winnerIndex,
    };

    return this.lastRoundSummary;
  }

  /**
   * Start next round after round summary has been acknowledged
   */
  startNextRound() {
    this.currentRound += 1;
    return this.startGame();
  }

  /**
   * Check if round is complete
   * Round complete when deck empty AND all hands played
   *
   * @returns {boolean}
   */
  isRoundComplete() {
    const deckEmpty =
      !this.gameState.deck || this.gameState.deck.cards.length === 0;
    const allHandsEmpty = this.gameState.players.every(
      (p) => !p.hand || p.hand.length === 0,
    );
    const result = deckEmpty && allHandsEmpty;

    // DEBUG logging for moves where both might be empty
    if (
      (this.gameState.players[0].hand.length === 0 &&
        this.gameState.players[1].hand.length === 0) ||
      (this.gameState.deck && this.gameState.deck.cards.length === 0)
    ) {
      //console.log(`[isRoundComplete] deck=${this.gameState.deck?.cards.length || 0}, p0=${this.gameState.players[0].hand.length}, p1=${this.gameState.players[1].hand.length}, result=${result}`);
    }

    return result;
  }

  /**
   * Check if game is over
   * Proper Escoba de Quince rules: First to 21 points with at least 2-point lead
   *
   * @returns {boolean}
   */
  isGameOver() {
    const p1Score = this.gameState.players[0].score;
    const p2Score = this.gameState.players[1].score;
    const minWinScore = 21;
    const minPointDifference = 2;

    // Player 1 wins: 21+ points AND 2+ point lead
    if (p1Score >= minWinScore && p1Score - p2Score >= minPointDifference) {
      return true;
    }

    // Player 2 wins: 21+ points AND 2+ point lead
    if (p2Score >= minWinScore && p2Score - p1Score >= minPointDifference) {
      return true;
    }

    return false;
  }

  /**
   * Get winner
   *
   * @returns {number|null} Player index or null if tied/not over
   */
  getWinner() {
    if (!this.isGameOver()) {
      return null;
    }

    if (this.gameState.players[0].score > this.gameState.players[1].score) {
      return 0;
    }
    if (this.gameState.players[1].score > this.gameState.players[0].score) {
      return 1;
    }
    return null; // Tie
  }

  /**
   * Check if game is tied
   *
   * @returns {boolean}
   */
  isTie() {
    return (
      this.isGameOver() &&
      this.gameState.players[0].score === this.gameState.players[1].score
    );
  }

  /**
   * Get current game state
   *
   * @returns {Object}
   */
  getGameState() {
    return this.gameState;
  }

  /**
   * Get current player index
   *
   * @returns {number}
   */
  getCurrentPlayer() {
    return this.gameState.currentPlayerIndex;
  }

  /**
   * Get current round number
   *
   * @returns {number}
   */
  getCurrentRound() {
    return this.currentRound;
  }

  /**
   * Get move history
   *
   * @returns {Array}
   */
  getMoveHistory() {
    return this.moveHistory;
  }

  /**
   * Get available moves for player
   * All cards in hand can be played (discard or capture)
   *
   * @param {number} playerIndex - Player index
   * @returns {Array} Available moves
   */
  getAvailableMoves(playerIndex) {
    const hand = this.gameState.players[playerIndex]?.hand;
    if (!hand || hand.length === 0) {
      return [];
    }

    const moves = [];

    for (const card of hand) {
      // Discard option
      moves.push({ card, isCapture: false });

      // Capture options
      const captures = CaptureEngine.getValidCaptures(
        card,
        this.gameState.tableCards,
      );
      for (const capture of captures) {
        moves.push({
          card,
          capture,
          isCapture: true,
          isEscoba: capture.length === this.gameState.tableCards.length,
        });
      }
    }

    return moves;
  }

  /**
   * Get player info
   *
   * @param {number} playerIndex - Player index
   * @returns {Object}
   */
  getPlayerInfo(playerIndex) {
    const player = this.gameState.players[playerIndex];
    return {
      name: player?.name || `Player ${playerIndex + 1}`,
      score: player?.score || 0,
      handSize: player?.hand?.length || 0,
      capturedSize: player?.pile?.length || 0,
      escobas: this.gameState.stats?.escobas?.[playerIndex] || 0,
    };
  }

  /**
   * Reset game to initial state
   */
  reset() {
    this.gameState = new GameState(this.config);
    this.moveHistory = [];
    this.currentRound = 0;
    this.deck = null;
  }
}

const PRIME_VALUE_BY_RANK = {
  7: 8,
  6: 7,
  as: 6,
  5: 5,
  4: 4,
  3: 3,
  2: 2,
  sota: 1,
  caballo: 1,
  rey: 1,
};

const PRIME_LABEL_BY_VALUE = {
  8: "7",
  7: "6",
  6: "As",
  5: "5",
  4: "4",
  3: "3",
  2: "2",
  1: "Figure",
  0: "-",
};

function buildPrimeSignature(cards) {
  const suits = ["oros", "copas", "espadas", "bastos"];
  const bestValues = [];
  const bestRanksBySuit = [];

  for (const suit of suits) {
    let best = 0;
    let bestRank = null;
    for (const card of cards) {
      if (card.suit !== suit) continue;
      const value = PRIME_VALUE_BY_RANK[card.rank] || 0;
      if (value > best) {
        best = value;
        bestRank = card.rank;
      }
    }
    bestValues.push(best);
    bestRanksBySuit.push(bestRank);
  }

  const vector = bestValues.sort((a, b) => b - a);
  const label = vector.map((v) => PRIME_LABEL_BY_VALUE[v] || "-").join(", ");

  const suitNames = {
    oros: "Oros",
    copas: "Copas",
    espadas: "Espadas",
    bastos: "Bastos",
  };

  const rankNames = {
    as: "As",
    sota: "Sota",
    caballo: "Caballo",
    rey: "Rey",
  };

  const suitBest = suits
    .map((suit, index) => {
      const rank = bestRanksBySuit[index];
      const rankLabel = rank ? rankNames[rank] || rank : "-";
      return `${suitNames[suit]} ${rankLabel}`;
    })
    .join(", ");

  const display = `${suitBest} (prime: ${label})`;
  const short = `O:${rankToShort(bestRanksBySuit[0])} C:${rankToShort(bestRanksBySuit[1])} E:${rankToShort(bestRanksBySuit[2])} B:${rankToShort(bestRanksBySuit[3])} (prime: ${label})`;

  return { vector, label, display, short };
}

function rankToShort(rank) {
  if (!rank) return "-";
  if (rank === "as") return "As";
  if (rank === "sota") return "S";
  if (rank === "caballo") return "C";
  if (rank === "rey") return "R";
  return rank;
}
