/**
 * Test suite for round end mechanics
 * Tests: final card award, round completion, tie detection
 * Requirement: FR-7 (Round End), FR-8 (Scoring)
 */

import { beforeEach, describe, expect, it } from "vitest";
import { Card } from "../core/card.js";
import {
  awardFinalCards,
  detectTie,
  executeRoundEnd,
  isRoundComplete,
} from "../core/round-end.js";

describe("Round End Mechanics", () => {
  let player1;
  let player2;
  let tableCards;

  beforeEach(() => {
    player1 = {
      name: "Player 1",
      hand: [],
      pile: [
        new Card("oros", "as"),
        new Card("oros", "2"),
        new Card("oros", "3"),
      ],
      escobas: 1,
    };

    player2 = {
      name: "Player 2",
      hand: [],
      pile: [new Card("copas", "as"), new Card("copas", "2")],
      escobas: 0,
    };

    tableCards = [new Card("espadas", "7"), new Card("bastos", "5")];
  });

  it("should award remaining table cards to last capturer", () => {
    // Given: player with existing pile, table with 2 cards
    const originalPileSize = player1.pile.length;

    // When: awarding final cards
    const updatedPlayer = awardFinalCards(tableCards, player1);

    // Then: player's pile should include table cards
    expect(updatedPlayer.pile.length).toBe(originalPileSize + 2);
    expect(updatedPlayer.pile[updatedPlayer.pile.length - 1]).toEqual(
      tableCards[1],
    );
  });

  it("should handle empty table at round end", () => {
    // Given: no table cards remaining
    const emptyTable = [];

    // When: attempting to award empty table
    const updatedPlayer = awardFinalCards(emptyTable, player1);

    // Then: player should be unchanged
    expect(updatedPlayer.pile.length).toBe(player1.pile.length);
  });

  it("should detect round completion when stock empty and hands played", () => {
    // Given: gameState with empty deck and empty hands
    const gameState = {
      deck: { isEmpty: true },
      players: [player1, player2],
      phase: "playing",
    };

    // When: checking if round is complete
    const complete = isRoundComplete(gameState);

    // Then: round should be marked complete
    expect(complete).toBe(true);
  });

  it("should not complete round if stock still has cards", () => {
    // Given: gameState with cards remaining in deck
    const gameState = {
      deck: { isEmpty: false, remaining: 5 },
      players: [player1, player2],
      phase: "playing",
    };

    // When: checking if round is complete
    const complete = isRoundComplete(gameState);

    // Then: round should not be complete
    expect(complete).toBe(false);
  });

  it("should execute round end with final card award", () => {
    // Given: round end configuration with remaining table cards
    const gameState = {
      deck: { isEmpty: true },
      players: [player1, player2],
      phase: "playing",
    };

    const config = {
      tableCards,
      lastCapturer: player1,
      gameState,
    };

    // When: executing round end
    const result = executeRoundEnd(config);

    // Then: should award cards and transition to scoring
    expect(result.success).toBe(true);
    expect(result.finalCardsAwarded.length).toBe(2);
    expect(result.gameState.phase).toBe("scoring");
    expect(result.updatedLastCapturer.pile.length).toBe(
      player1.pile.length + 2,
    );
  });

  it("should detect tie when both players have equal round score", () => {
    // Given: both players with same round score
    const p1Result = { roundScore: 10 };
    const p2Result = { roundScore: 10 };

    // When: detecting tie
    const tieResult = detectTie(p1Result, p2Result);

    // Then: should be marked as tie
    expect(tieResult.isTie).toBe(true);
    expect(tieResult.score).toBe(10);
  });

  it("should identify winner in non-tie scenario", () => {
    // Given: players with different scores
    const p1Result = { roundScore: 12 };
    const p2Result = { roundScore: 8 };

    // When: detecting winner
    const result = detectTie(p1Result, p2Result);

    // Then: player1 should be winner
    expect(result.isTie).toBe(false);
    expect(result.winner).toBe("player1");
    expect(result.scores.player1).toBe(12);
  });
});
