/**
 * Advanced Evaluation Heuristics Tests
 * Tests for hand composition, capture sequences, endgame, forcing moves
 *
 * Test Coverage:
 * - Hand flexibility scoring
 * - Hand commitment penalties
 * - Capture sequence bonuses
 * - Endgame detection
 * - Endgame position adjustments
 * - Forcing move detection
 * - Strategic position evaluation
 * - Move quality estimation
 */

import { describe, expect, it } from "vitest";
import {
  estimateMoveQuality,
  evaluateEndgamePosition,
  evaluatePositionStrategic,
  isEndgame,
  scoreForcing,
  scoreHandCommitment,
  scoreHandFlexibility,
  scoreSequentialCaptures,
} from "../ai/evaluation-heuristics.js";

describe("Hand Composition Scoring", () => {
  it("should score flexible hand with matching table cards", () => {
    const hand = [
      { value: 3, suit: "espadas" },
      { value: 7, suit: "oros" },
      { value: 5, suit: "copas" },
    ];
    const tableCards = [
      { value: 3, suit: "bastos" },
      { value: 7, suit: "espadas" },
    ];

    const score = scoreHandFlexibility(hand, tableCards);
    // 2 cards match table (3 and 7), so 2 * 0.5 = 1.0
    expect(score).toBe(1.0);
  });

  it("should return 0 for hand with no matching cards", () => {
    const hand = [
      { value: 1, suit: "espadas" },
      { value: 2, suit: "oros" },
    ];
    const tableCards = [
      { value: 5, suit: "bastos" },
      { value: 6, suit: "copas" },
    ];

    const score = scoreHandFlexibility(hand, tableCards);
    expect(score).toBe(0);
  });

  it("should return 0 for empty hand", () => {
    expect(scoreHandFlexibility([], [])).toBe(0);
    expect(scoreHandFlexibility([], [{ value: 3 }])).toBe(0);
  });

  it("should score commitment penalty for unplayable cards", () => {
    const hand = [
      { value: 1, suit: "espadas" },
      { value: 2, suit: "oros" },
      { value: 3, suit: "copas" },
    ];
    const tableCards = [{ value: 5, suit: "bastos" }];

    // All 3 cards unplayable, penalty = 3 * 0.3 = 0.9
    const penalty = scoreHandCommitment(hand, tableCards);
    expect(penalty).toBeCloseTo(-0.9, 5);
  });

  it("should reduce commitment penalty when cards match", () => {
    const hand = [
      { value: 1, suit: "espadas" },
      { value: 2, suit: "oros" },
      { value: 5, suit: "copas" },
    ];
    const tableCards = [{ value: 5, suit: "bastos" }];

    // Only 2 cards unplayable, penalty = 2 * 0.3 = 0.6
    const penalty = scoreHandCommitment(hand, tableCards);
    expect(penalty).toBe(-0.6);
  });
});

describe("Capture Sequence Scoring", () => {
  it("should give escoba bonus for clearing table", () => {
    const move = {
      card: { value: 10, suit: "espadas" },
      isCapture: true,
      capturedCards: [
        { value: 5, suit: "oros" },
        { value: 5, suit: "copas" },
      ],
    };
    const hand = [{ value: 3, suit: "bastos" }];
    const tableCards = [
      { value: 5, suit: "oros" },
      { value: 5, suit: "copas" },
    ];

    const score = scoreSequentialCaptures(move, hand, tableCards);
    // No cards left on table after capture (escoba) = 20.0 (scaled from 3.0)
    expect(score).toBe(20.0);
  });

  it("should bonus for follow-up capture opportunities", () => {
    const move = {
      card: { value: 5, suit: "espadas" },
      isCapture: true,
      capturedCards: [{ value: 5, suit: "oros" }],
    };
    const hand = [
      { value: 5, suit: "espadas" },
      { value: 3, suit: "bastos" },
      { value: 3, suit: "copas" },
    ];
    const tableCards = [
      { value: 5, suit: "oros" },
      { value: 3, suit: "espadas" },
    ];

    const score = scoreSequentialCaptures(move, hand, tableCards);
    // After capture: table has 3-espadas
    // Hand has: 3-bastos, 3-copas that can follow up = 2 * 5.0
    expect(score).toBe(10.0);
  });

  it("should return 0 for non-capture moves", () => {
    const move = { card: { value: 3 }, isCapture: false };
    const score = scoreSequentialCaptures(move, [], []);
    expect(score).toBe(0);
  });

  it("should handle null move", () => {
    const score = scoreSequentialCaptures(null, [], []);
    expect(score).toBe(0);
  });
});

describe("Endgame Detection", () => {
  it("should detect endgame when deck has 6 cards", () => {
    const gameState = {
      deck: { cards: Array(6).fill({ value: 1 }) },
    };
    expect(isEndgame(gameState)).toBe(true);
  });

  it("should detect endgame when deck has fewer than 6 cards", () => {
    const gameState = {
      deck: { cards: Array(3).fill({ value: 1 }) },
    };
    expect(isEndgame(gameState)).toBe(true);
  });

  it("should not detect endgame when deck has more than 6 cards", () => {
    const gameState = {
      deck: { cards: Array(20).fill({ value: 1 }) },
    };
    expect(isEndgame(gameState)).toBe(false);
  });

  it("should handle empty or missing deck", () => {
    expect(isEndgame({ deck: null })).toBe(false);
    expect(isEndgame(null)).toBe(false);
    expect(isEndgame({ deck: { cards: [] } })).toBe(true);
  });
});

describe("Endgame Position Evaluation", () => {
  it("should add bonus for escoba in endgame", () => {
    const gameState = {
      deck: { cards: Array(6).fill({ value: 1 }) },
    };
    const move = {
      isCapture: true,
      capturedCards: [
        { value: 5, suit: "oros" },
        { value: 5, suit: "copas" },
        { value: 5, suit: "espadas" },
      ],
    };

    const baseScore = 2;
    const adjusted = evaluateEndgamePosition(baseScore, move, gameState);
    // Escoba bonus (3+ cards) = 1.5 + base = 3.5
    expect(adjusted).toBeGreaterThan(baseScore);
  });

  it("should not adjust score outside endgame", () => {
    const gameState = {
      deck: { cards: Array(20).fill({ value: 1 }) },
    };
    const move = { isCapture: true };

    const baseScore = 2;
    const adjusted = evaluateEndgamePosition(baseScore, move, gameState);
    expect(adjusted).toBe(baseScore);
  });

  it("should bonus high-value captures in endgame (7-oros, face cards)", () => {
    const gameState = {
      deck: { cards: Array(3).fill({ value: 1 }) },
    };
    const move = {
      isCapture: true,
      capturedCards: [
        { value: 7, suit: "oros", rank: "7" },
        { value: 10, suit: "espadas" },
      ],
    };

    const baseScore = 1;
    const adjusted = evaluateEndgamePosition(baseScore, move, gameState);
    // 7-oros + face card (2 high value) = 2 * 0.5 + escoba check bonus
    expect(adjusted).toBeGreaterThan(baseScore);
  });
});

describe("Forcing Move Detection", () => {
  it("should give bonus when opponent has no moves", () => {
    const move = { card: { value: 3 } };
    const opponentMoves = [];

    const score = scoreForcing(move, opponentMoves);
    expect(score).toBe(10.0);
  });

  it("should give bonus when opponent forced to single move", () => {
    const move = { card: { value: 3 } };
    const opponentMoves = [{ card: { value: 5 }, isCapture: true }];

    const score = scoreForcing(move, opponentMoves);
    expect(score).toBe(7.5);
  });

  it("should give bonus when all opponent moves are capture", () => {
    const move = { card: { value: 3 } };
    const opponentMoves = [
      { card: { value: 5 }, isCapture: true },
      { card: { value: 7 }, isCapture: true },
    ];

    const score = scoreForcing(move, opponentMoves);
    expect(score).toBe(4.0);
  });

  it("should return 0 when opponent has good options", () => {
    const move = { card: { value: 3 } };
    const opponentMoves = [
      { card: { value: 5 }, isCapture: false },
      { card: { value: 7 }, isCapture: true },
      { card: { value: 3 }, isCapture: true },
    ];

    const score = scoreForcing(move, opponentMoves);
    expect(score).toBe(0);
  });
});

describe("Strategic Position Evaluation", () => {
  it("should combine all evaluation factors", () => {
    const gameState = {
      scores: [10, 8],
      currentPlayerIndex: 0,
      players: [{ hand: [{ value: 3 }] }, { hand: [] }],
      tableCards: [{ value: 3 }],
      deck: { cards: Array(20).fill({ value: 1 }) },
    };

    const move = {
      card: { value: 3, suit: "espadas" },
      isCapture: true,
      capturedCards: [{ value: 3, suit: "oros" }],
    };

    const score = evaluatePositionStrategic(
      2,
      move,
      gameState.players[0].hand,
      gameState.tableCards,
      gameState,
      [],
    );

    // Should include base score + strategic bonuses
    expect(score).toBeGreaterThanOrEqual(2);
  });

  it("should handle null move gracefully", () => {
    const gameState = {
      scores: [10, 8],
      currentPlayerIndex: 0,
      players: [{ hand: [{ value: 3 }] }, { hand: [] }],
      tableCards: [{ value: 5 }],
    };

    const score = evaluatePositionStrategic(
      0,
      null,
      gameState.players[0].hand,
      gameState.tableCards,
      gameState,
      [],
    );

    expect(typeof score).toBe("number");
  });
});

describe("Move Quality Estimation", () => {
  it("should prioritize captures over discards", () => {
    const captureMove = {
      card: { value: 5 },
      isCapture: true,
      capturedCards: [{ value: 5, suit: "oros" }],
    };
    const discardMove = { card: { value: 3 }, isCapture: false };

    const captureQuality = estimateMoveQuality(captureMove, [], []);
    const discardQuality = estimateMoveQuality(discardMove, [], []);

    expect(captureQuality).toBeGreaterThan(discardQuality);
  });

  it("should prioritize larger captures (escobas)", () => {
    const smallCapture = {
      card: { value: 5 },
      isCapture: true,
      capturedCards: [{ value: 5, suit: "oros" }],
    };
    const largeCapture = {
      card: { value: 10 },
      isCapture: true,
      capturedCards: [
        { value: 5, suit: "oros" },
        { value: 5, suit: "copas" },
        { value: 5, suit: "espadas" },
      ],
    };

    const smallQuality = estimateMoveQuality(smallCapture, [], []);
    const largeQuality = estimateMoveQuality(largeCapture, [], []);

    expect(largeQuality).toBeGreaterThan(smallQuality);
  });

  it("should deprioritize forced discards (no options)", () => {
    const forcedDiscard = {
      card: { value: 1 },
      isCapture: false,
    };
    const optionalDiscard = {
      card: { value: 3 },
      isCapture: false,
    };

    const hand = [{ value: 1 }, { value: 3 }];
    const tableCards = [{ value: 3, suit: "oros" }];

    const forcedQuality = estimateMoveQuality(forcedDiscard, hand, tableCards);
    const optionalQuality = estimateMoveQuality(
      optionalDiscard,
      hand,
      tableCards,
    );

    expect(optionalQuality).toBeGreaterThan(forcedQuality);
  });

  it("should give escoba bonus for 4+ card captures", () => {
    const smallCapture = {
      card: { value: 5 },
      isCapture: true,
      capturedCards: [{ value: 1 }, { value: 2 }],
    };
    const escoba = {
      card: { value: 5 },
      isCapture: true,
      capturedCards: [{ value: 1 }, { value: 2 }, { value: 1 }, { value: 1 }],
    };

    const smallQuality = estimateMoveQuality(smallCapture, [], []);
    const escobaQuality = estimateMoveQuality(escoba, [], []);

    expect(escobaQuality).toBeGreaterThan(smallQuality);
  });
});
