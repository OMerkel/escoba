/**
 * Test suite for Turn module
 * Tests: turn creation, card play, capture selection
 * Requirement: FR-3 (Turn structure)
 */

import { describe, expect, it } from "vitest";
import { Card } from "../core/card.js";
import { Turn } from "../core/turn.js";

describe("Turn", () => {
  it("should create turn for player", () => {
    const player = { id: "p1", name: "Player 1" };
    const tableCards = [];

    const turn = new Turn(player, tableCards);
    expect(turn.player.id).toBe("p1");
    expect(turn.cardPlayed).toBeNull();
  });

  it("should play card", () => {
    const player = { id: "p1" };
    const card = new Card("oros", "5", 5);
    const turn = new Turn(player, []);

    const updated = turn.playCard(card);
    expect(updated.cardPlayed).toEqual(card);
  });

  it("should select capture", () => {
    const player = { id: "p1" };
    const card = new Card("oros", "7", 7);
    const captureCards = [new Card("copas", "7", 7)];

    const turn = new Turn(player, []).playCard(card);
    const updated = turn.selectCapture(captureCards);
    expect(updated.captureSet).toHaveLength(1);
  });

  it("should discard without capture", () => {
    const player = { id: "p1" };
    const card = new Card("oros", "3", 3);

    const turn = new Turn(player, []).playCard(card);
    const updated = turn.discard();
    expect(updated.captureSet).toHaveLength(0);
  });
});
