/**
 * Persistence Module
 * Handles: SGF game export/import, statistics tracking, configuration storage
 * Requirements: FR-14 (Statistics), FR-16 (SGF Format), FR-17 (Configuration)
 */

/**
 * Parse SGF game record
 * FR-16.1: Parse SGF format to initialize game situation
 *
 * @param {string} sgfString - SGF format string
 * @returns {Object} Parsed game data {hands, tableCards, captured}
 */
export function parseSGF(sgfString) {
  if (!sgfString || typeof sgfString !== "string") {
    return null;
  }

  try {
    // Simple SGF parser for escoba (subset of SGF format)
    // Format: (;GM[escoba]P1[name]P2[name]H1[As of oros,2 of copas]...
    const gameMatch = sgfString.match(/\(;(.+)\)/);
    if (!gameMatch) return null;

    const content = gameMatch[1];
    const result = {
      players: [],
      hands: [[], []],
      tableCards: [],
      captured: [[], []],
      moveHistory: [],
    };

    // Extract player names
    const p1Match = content.match(/P1\[([^\]]+)\]/);
    const p2Match = content.match(/P2\[([^\]]+)\]/);
    if (p1Match) result.players[0] = p1Match[1];
    if (p2Match) result.players[1] = p2Match[1];

    // Extract hands
    const h1Match = content.match(/H1\[([^\]]+)\]/);
    const h2Match = content.match(/H2\[([^\]]+)\]/);
    if (h1Match) result.hands[0] = parseCardList(h1Match[1]);
    if (h2Match) result.hands[1] = parseCardList(h2Match[1]);

    // Extract table
    const tableMatch = content.match(/T\[([^\]]+)\]/);
    if (tableMatch) result.tableCards = parseCardList(tableMatch[1]);

    // Extract captured
    const c1Match = content.match(/C1\[([^\]]+)\]/);
    const c2Match = content.match(/C2\[([^\]]+)\]/);
    if (c1Match) result.captured[0] = parseCardList(c1Match[1]);
    if (c2Match) result.captured[1] = parseCardList(c2Match[1]);

    // Extract move history
    const movesMatch = content.match(/M\[([^\]]+)\]/);
    if (movesMatch) {
      result.moveHistory = movesMatch[1].split(",").map((m) => m.trim());
    }

    return result;
  } catch (err) {
    console.error("Error parsing SGF:", err);
    return null;
  }
}

/**
 * Parse card list from SGF format
 * Format: "As of oros, 2 of copas, 3 of espadas"
 *
 * @param {string} cardString - Comma-separated card names
 * @returns {string[]} Array of card descriptions
 */
function parseCardList(cardString) {
  if (!cardString) return [];
  return cardString.split(",").map((card) => card.trim());
}

/**
 * Export game to SGF format
 * FR-16.2: Export game to human-readable SGF format
 *
 * @param {Object} gameData - Game state to export
 * @returns {string} SGF format string
 */
export function exportToSGF(gameData) {
  if (!gameData) {
    return null;
  }

  const {
    players = ["Player 1", "Player 2"],
    hands = [[], []],
    tableCards = [],
    captured = [[], []],
    scores = [0, 0],
    moveHistory = [],
  } = gameData;

  const sgfParts = [
    "GM[escoba]",
    `P1[${players[0]}]`,
    `P2[${players[1]}]`,
    `H1[${cardListToString(hands[0])}]`,
    `H2[${cardListToString(hands[1])}]`,
    `T[${cardListToString(tableCards)}]`,
    `C1[${cardListToString(captured[0])}]`,
    `C2[${cardListToString(captured[1])}]`,
    `S1[${scores[0]}]`,
    `S2[${scores[1]}]`,
    `M[${moveHistory.join(",")}]`,
  ];

  return `(;${sgfParts.join("")})`;
}

/**
 * Convert card array to SGF string
 *
 * @param {Array} cards - Card array
 * @returns {string} Comma-separated card names
 */
function cardListToString(cards) {
  if (!Array.isArray(cards)) return "";
  return cards
    .map((card) => {
      if (typeof card === "string") return card;
      return card.displayName || card.toString();
    })
    .join(",");
}

/**
 * Player statistics object
 */
export class PlayerStats {
  constructor(playerName) {
    this.playerName = playerName;
    this.roundsPlayed = 0;
    this.roundsWon = 0;
    this.totalScore = 0;
    this.totalEscobas = 0;
    this.cardsWon = 0;
    this.orosWon = 0;
  }

  /**
   * Record a round result
   * FR-14.1, FR-14.2: Track cumulative stats
   *
   * @param {Object} roundResult - {won: boolean, score: number, escobas: number}
   */
  recordRound(roundResult) {
    this.roundsPlayed += 1;
    if (roundResult.won) this.roundsWon += 1;
    this.totalScore += roundResult.score || 0;
    this.totalEscobas += roundResult.escobas || 0;
    this.cardsWon += roundResult.cards || 0;
    this.orosWon += roundResult.oros || 0;
  }

  /**
   * Get win rate
   * FR-14.3: Calculate win percentage
   *
   * @returns {number} Win rate 0-100
   */
  getWinRate() {
    if (this.roundsPlayed === 0) return 0;
    return Math.round((this.roundsWon / this.roundsPlayed) * 100);
  }

  /**
   * Get average escobas per round
   * FR-14.4: Calculate average escobas
   *
   * @returns {number} Average escobas
   */
  getAverageEscobas() {
    if (this.roundsPlayed === 0) return 0;
    return +(this.totalEscobas / this.roundsPlayed).toFixed(1);
  }

  /**
   * Get average score per round
   *
   * @returns {number} Average score
   */
  getAverageScore() {
    if (this.roundsPlayed === 0) return 0;
    return +(this.totalScore / this.roundsPlayed).toFixed(1);
  }

  /**
   * Reset statistics
   *
   * @returns {PlayerStats} New instance with reset stats
   */
  reset() {
    return new PlayerStats(this.playerName);
  }
}

/**
 * Game statistics manager
 * FR-14: Track and calculate game statistics
 */
export class StatisticsManager {
  constructor() {
    this.players = new Map(); // playerName -> PlayerStats
    this.gameHistory = []; // Array of game results
  }

  /**
   * Get or create player stats
   *
   * @param {string} playerName - Player name
   * @returns {PlayerStats} Player statistics
   */
  getPlayerStats(playerName) {
    if (!this.players.has(playerName)) {
      this.players.set(playerName, new PlayerStats(playerName));
    }
    return this.players.get(playerName);
  }

  /**
   * Record game result
   * FR-14.1, FR-14.2: Record game outcomes
   *
   * @param {Object} gameResult - {player1: {name, score, won}, player2: {...}}
   */
  recordGame(gameResult) {
    if (!gameResult) return;

    const { player1, player2 } = gameResult;

    if (player1) {
      const stats = this.getPlayerStats(player1.name);
      stats.recordRound({
        won: player1.won,
        score: player1.score || 0,
        escobas: player1.escobas || 0,
      });
    }

    if (player2) {
      const stats = this.getPlayerStats(player2.name);
      stats.recordRound({
        won: player2.won,
        score: player2.score || 0,
        escobas: player2.escobas || 0,
      });
    }

    this.gameHistory.push(gameResult);
  }

  /**
   * Get all player statistics
   *
   * @returns {Object} All player stats as object
   */
  getAllStats() {
    const result = {};
    this.players.forEach((stats, name) => {
      result[name] = {
        roundsPlayed: stats.roundsPlayed,
        roundsWon: stats.roundsWon,
        winRate: stats.getWinRate(),
        totalScore: stats.totalScore,
        averageScore: stats.getAverageScore(),
        totalEscobas: stats.totalEscobas,
        averageEscobas: stats.getAverageEscobas(),
      };
    });
    return result;
  }

  /**
   * Clear all statistics
   */
  clear() {
    this.players.clear();
    this.gameHistory = [];
  }
}
