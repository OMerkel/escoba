/**
 * Tournament Runner for AI Play Testing
 * Runs multiple games between different strategies to measure performance
 *
 * Purpose: Validate Phase 1 & Phase 2 AI enhancements through empirical play testing
 * Compares: Greedy variants, Phase 2 endgame, Negamax, and difficulty tiers
 */

import { selectGreedyMove } from "../ai/ai-strategy.js";
import {
  selectCardPreservingMove,
  selectMomentumMove,
  selectRiskAverseMove,
} from "../ai/greedy-variants.js";
import { selectNegamaxMove } from "../ai/negamax.js";
import {
  selectCardPreservingEndgameMove,
  selectGreedyEndgameMove,
  selectMomentumEndgameMove,
} from "../ai/phase2-enhanced-strategies.js";
import { GameEngine } from "../core/game-engine.js";

/**
 * Run a single match between two AI strategies
 *
 * @param {string} strategy1 - Strategy for player 1: "greedy" or "negamax"
 * @param {string} strategy2 - Strategy for player 2: "greedy" or "negamax"
 * @param {Object} config - Game configuration
 * @returns {Object} Match result {winner, strategy1Score, strategy2Score, moves, duration}
 */
export async function playMatch(strategy1, strategy2, config = {}) {
  const startTime = Date.now();
  const engine = new GameEngine({
    players: ["AI1", "AI2"],
    targetScore: config.targetScore || 21, // Proper Escoba de Quince rules (21 points + 2-point lead)
    ...config,
  });

  engine.startGame();

  let moveCount = 0;
  const maxMoves = 500; // Safety limit to prevent infinite loops

  // Play until game over
  while (!engine.isGameOver() && moveCount < maxMoves) {
    const currentPlayer = engine.getCurrentPlayer();
    const hand = engine.gameState.players[currentPlayer].hand;
    const tableCards = engine.gameState.tableCards;

    // Safety check: stop if BOTH hands are empty AND deck is empty (natural round end)
    const bothHandsEmpty =
      engine.gameState.players[0].hand.length === 0 &&
      engine.gameState.players[1].hand.length === 0;
    const deckEmpty =
      !engine.gameState.deck || engine.gameState.deck.cards.length === 0;

    if (bothHandsEmpty && deckEmpty) {
      // Round is complete - score it
      engine.completeRound();
      if (engine.isGameOver()) {
        break;
      }
      // Otherwise continue with new round
    }

    // Skip if current player hand is empty (but other player isn't, so should re-deal)
    if (!hand || hand.length === 0) {
      // Let next player go, which should trigger re-dealing
      continue;
    }

    let move;

    try {
      // Select move based on strategy
      if (currentPlayer === 0) {
        if (strategy1 === "greedy") {
          move = selectGreedyMove(hand, tableCards, engine.gameState);
        } else if (strategy1 === "greedy-endgame") {
          move = selectGreedyEndgameMove(hand, tableCards, engine.gameState);
        } else if (strategy1 === "risk-averse") {
          move = selectRiskAverseMove(hand, tableCards, engine.gameState);
        } else if (strategy1 === "card-preserving") {
          move = selectCardPreservingMove(hand, tableCards, engine.gameState);
        } else if (strategy1 === "card-preserving-endgame") {
          move = selectCardPreservingEndgameMove(
            hand,
            tableCards,
            engine.gameState,
          );
        } else if (strategy1 === "momentum") {
          move = selectMomentumMove(hand, tableCards, engine.gameState);
        } else if (strategy1 === "momentum-endgame") {
          move = selectMomentumEndgameMove(hand, tableCards, engine.gameState);
        } else if (strategy1 === "negamax") {
          move = selectNegamaxMove(hand, tableCards, engine.gameState, {
            negamaxDepth: config.negamaxDepth || 6,
            aiResponseTime: 1000,
          });
        }
      } else {
        if (strategy2 === "greedy") {
          move = selectGreedyMove(hand, tableCards, engine.gameState);
        } else if (strategy2 === "greedy-endgame") {
          move = selectGreedyEndgameMove(hand, tableCards, engine.gameState);
        } else if (strategy2 === "risk-averse") {
          move = selectRiskAverseMove(hand, tableCards, engine.gameState);
        } else if (strategy2 === "card-preserving") {
          move = selectCardPreservingMove(hand, tableCards, engine.gameState);
        } else if (strategy2 === "card-preserving-endgame") {
          move = selectCardPreservingEndgameMove(
            hand,
            tableCards,
            engine.gameState,
          );
        } else if (strategy2 === "momentum") {
          move = selectMomentumMove(hand, tableCards, engine.gameState);
        } else if (strategy2 === "momentum-endgame") {
          move = selectMomentumEndgameMove(hand, tableCards, engine.gameState);
        } else if (strategy2 === "negamax") {
          move = selectNegamaxMove(hand, tableCards, engine.gameState, {
            negamaxDepth: config.negamaxDepth || 6,
            aiResponseTime: 1000,
          });
        }
      }

      if (!move) {
        // Fallback: discard first card if no move found
        move = { card: hand[0], isCapture: false };
      }

      // Execute move
      const result = engine.playTurn(currentPlayer, move);

      if (!result.success) {
        if (moveCount < 50) {
          // Only log first few errors to avoid spam
          console.warn(
            `Invalid move rejected at turn ${moveCount}: ${result.error}`,
          );
        }
        // Try fallback discard
        move = { card: hand[0], isCapture: false };
        const fallbackResult = engine.playTurn(currentPlayer, move);
        if (!fallbackResult.success) {
          console.error(
            `Fallback discard also failed: ${fallbackResult.error}`,
          );
          break;
        }
      }

      moveCount++;
    } catch (err) {
      console.error(`Error during move: ${err.message}`);
      break;
    }
  }

  const duration = Date.now() - startTime;

  // Determine winner
  const info1 = engine.getPlayerInfo(0);
  const info2 = engine.getPlayerInfo(1);

  let winner;
  if (info1.score > info2.score) {
    winner = 0;
  } else if (info2.score > info1.score) {
    winner = 1;
  } else {
    winner = -1; // Tie
  }

  return {
    winner,
    player1: {
      strategy: strategy1,
      score: info1.score,
      cards: info1.cardsWon,
      escobas: info1.escobasWon,
    },
    player2: {
      strategy: strategy2,
      score: info2.score,
      cards: info2.cardsWon,
      escobas: info2.escobasWon,
    },
    moves: moveCount,
    duration,
    gameOver: engine.isGameOver(),
  };
}

/**
 * Run tournament of multiple matches
 *
 * @param {string} strategy1 - Strategy for player 1
 * @param {string} strategy2 - Strategy for player 2
 * @param {number} numMatches - Number of matches to play
 * @param {Object} config - Game configuration
 * @returns {Object} Tournament results with statistics
 */
export async function runTournament(
  strategy1,
  strategy2,
  numMatches = 10,
  config = {},
) {
  const results = [];
  const stats = {
    strategy1: {
      wins: 0,
      losses: 0,
      ties: 0,
      totalScore: 0,
      totalCards: 0,
      totalEscobas: 0,
      avgGameLength: 0,
      avgDuration: 0,
    },
    strategy2: {
      wins: 0,
      losses: 0,
      ties: 0,
      totalScore: 0,
      totalCards: 0,
      totalEscobas: 0,
      avgGameLength: 0,
      avgDuration: 0,
    },
  };

  console.log(
    `\n🎮 Starting tournament: ${strategy1} vs ${strategy2} (${numMatches} matches)\n`,
  );

  // Run matches, alternating who goes first
  for (let i = 0; i < numMatches; i++) {
    // Alternate starting player for fairness
    let s1;
    let s2;
    if (i % 2 === 0) {
      s1 = strategy1;
      s2 = strategy2;
    } else {
      s1 = strategy2;
      s2 = strategy1;
    }

    try {
      const result = await playMatch(s1, s2, config);
      results.push(result);

      // Update statistics
      const p1Stats = i % 2 === 0 ? stats.strategy1 : stats.strategy2;
      const p2Stats = i % 2 === 0 ? stats.strategy2 : stats.strategy1;

      if (result.winner === 0) {
        p1Stats.wins++;
        p2Stats.losses++;
      } else if (result.winner === 1) {
        p2Stats.wins++;
        p1Stats.losses++;
      } else {
        p1Stats.ties++;
        p2Stats.ties++;
      }

      p1Stats.totalScore += result.player1.score;
      p2Stats.totalScore += result.player2.score;
      p1Stats.totalCards += result.player1.cards;
      p2Stats.totalCards += result.player2.cards;
      p1Stats.totalEscobas += result.player1.escobas;
      p2Stats.totalEscobas += result.player2.escobas;
      p1Stats.avgDuration += result.duration;
      p2Stats.avgDuration += result.duration;

      const matchNum = i + 1;
      const indicator =
        result.winner === (i % 2 === 0 ? 0 : 1)
          ? "✓"
          : result.winner === (i % 2 === 0 ? 1 : 0)
            ? "✗"
            : "=";
      console.log(
        `Match ${matchNum}/${numMatches} ${indicator} | ${s1} ${result.player1.score} - ${result.player2.score} ${s2} (${result.moves} moves, ${result.duration}ms)`,
      );
    } catch (err) {
      console.error(`Match ${i + 1} error: ${err.message}`);
    }
  }

  // Calculate averages
  stats.strategy1.avgGameLength = Math.round(
    results.reduce((sum, r) => sum + r.moves, 0) / numMatches,
  );
  stats.strategy2.avgGameLength = stats.strategy1.avgGameLength; // Same games
  stats.strategy1.avgDuration = Math.round(
    stats.strategy1.avgDuration / numMatches,
  );
  stats.strategy2.avgDuration = Math.round(
    stats.strategy2.avgDuration / numMatches,
  );

  return {
    strategy1,
    strategy2,
    numMatches,
    results,
    stats,
  };
}

/**
 * Format and print tournament results
 *
 * @param {Object} tournamentResults - Results from runTournament
 */
export function printResults(tournamentResults) {
  const { strategy1, strategy2, stats, numMatches } = tournamentResults;

  console.log(`\n${"=".repeat(80)}`);
  console.log("TOURNAMENT RESULTS");
  console.log("=".repeat(80));

  console.log(
    `\n📊 Match Summary: ${strategy1} vs ${strategy2} (${numMatches} matches)\n`,
  );

  const s1 = stats.strategy1;
  const s2 = stats.strategy2;

  // Win rate table
  console.log("Win Record:");
  console.log(
    `  ${strategy1}: ${s1.wins}W - ${s1.losses}L - ${s1.ties}T (${((s1.wins / numMatches) * 100).toFixed(1)}% win rate)`,
  );
  console.log(
    `  ${strategy2}: ${s2.wins}W - ${s2.losses}L - ${s2.ties}T (${((s2.wins / numMatches) * 100).toFixed(1)}% win rate)`,
  );

  // Scoring statistics
  console.log("\nAverage Scores:");
  console.log(
    `  ${strategy1}: ${(s1.totalScore / numMatches).toFixed(1)} points`,
  );
  console.log(
    `  ${strategy2}: ${(s2.totalScore / numMatches).toFixed(1)} points`,
  );

  console.log("\nAverage Cards Won:");
  console.log(
    `  ${strategy1}: ${(s1.totalCards / numMatches).toFixed(1)} cards`,
  );
  console.log(
    `  ${strategy2}: ${(s2.totalCards / numMatches).toFixed(1)} cards`,
  );

  console.log("\nTotal Escobas:");
  console.log(`  ${strategy1}: ${s1.totalEscobas} escobas`);
  console.log(`  ${strategy2}: ${s2.totalEscobas} escobas`);

  console.log("\nGame Statistics:");
  console.log(`  Average game length: ${s1.avgGameLength} moves`);
  console.log(`  Average duration: ${s1.avgDuration}ms per player per game`);

  // Verdict
  console.log(`\n${"-".repeat(80)}`);
  const s1WinRate = (s1.wins / numMatches) * 100;
  const s2WinRate = (s2.wins / numMatches) * 100;

  if (s1WinRate > s2WinRate + 5) {
    console.log(
      `✓ ${strategy1} is STRONGER (${s1WinRate.toFixed(1)}% vs ${s2WinRate.toFixed(1)}%)`,
    );
  } else if (s2WinRate > s1WinRate + 5) {
    console.log(
      `✓ ${strategy2} is STRONGER (${s2WinRate.toFixed(1)}% vs ${s1WinRate.toFixed(1)}%)`,
    );
  } else {
    console.log(
      `= BALANCED (${s1WinRate.toFixed(1)}% vs ${s2WinRate.toFixed(1)}%)`,
    );
  }

  console.log(`\n${"=".repeat(80)}\n`);
}

/**
 * Main entry point for tournament testing
 */
async function main() {
  try {
    // Run tournament: Greedy vs Negamax (Phase 1 enhanced)
    const results = await runTournament("greedy", "negamax", 50);

    // Print results
    printResults(results);

    // Summary for decision making
    console.log("\n📈 PHASE 1 IMPACT ASSESSMENT:\n");

    const negamaxWinRate =
      (results.stats.negamax.wins / results.numMatches) * 100;

    if (negamaxWinRate >= 55) {
      console.log("✅ Phase 1 is EFFECTIVE");
      console.log(
        `   Negamax with strategic heuristics wins ${negamaxWinRate.toFixed(1)}% of matches.`,
      );
      console.log("   Recommendation: PROCEED TO PHASE 2 (endgame detection)");
    } else if (negamaxWinRate >= 50) {
      console.log("⚠️  Phase 1 has MARGINAL IMPACT");
      console.log("   Negamax win rate is near 50%.");
      console.log(
        "   Recommendation: Tune heuristic weights or proceed to Phase 2 for synergy",
      );
    } else {
      console.log("❌ Phase 1 needs TUNING");
      console.log(
        "   Negamax win rate below 50% suggests weights need adjustment.",
      );
      console.log(
        "   Review: hand flexibility (0.5), commitment (-0.3), sequences (1.0, 3.0)",
      );
    }
  } catch (err) {
    console.error(`Tournament error: ${err.message}`);
    console.error(err.stack);
  }
}

// Export for testing
export { main };

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
