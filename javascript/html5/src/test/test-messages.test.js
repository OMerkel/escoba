import { describe, expect, it } from "vitest";

import { GAME_MESSAGES } from "../config/messages.js";

describe("Game Messages", () => {
  it("exposes key static messages", () => {
    // Given static UI messages, when read directly, then canonical text is stable.
    expect(GAME_MESSAGES.EMPTY_HAND).toBe("No cards in hand");
    expect(GAME_MESSAGES.INVALID_MOVE_GENERIC).toBe(
      "Invalid move. Please try again.",
    );
    expect(GAME_MESSAGES.ESCOBA_TOAST).toBe("🧹 ¡Escoba! +1 point 🧹");
    expect(GAME_MESSAGES.ROUND_COMPLETE_TOAST).toContain("Round complete");
  });

  it("formats invalid capture sum message", () => {
    // Given capture values, when formatting, then the message explains the failed 15-sum.
    const msg = GAME_MESSAGES.INVALID_CAPTURE_SUM(7, 6, 13);
    expect(msg).toBe("Invalid capture! 7 + 6 = 13, must equal 15.");
  });

  it("formats dynamic move and ai errors", () => {
    // Given runtime error details, when interpolated, then user-facing error text is deterministic.
    expect(GAME_MESSAGES.INVALID_MOVE_ERROR("bad move")).toBe(
      "Invalid move: bad move",
    );
    expect(GAME_MESSAGES.AI_MOVE_INVALID("bad ai move")).toBe(
      "AI move invalid: bad ai move",
    );
  });

  it("formats initial table special status message", () => {
    const msg = GAME_MESSAGES.INITIAL_TABLE_SPECIAL_STATUS(15, "AI North", 1);
    expect(msg).toContain("Initial table totaled 15");
    expect(msg).toContain("AI North");
    expect(msg).toContain("1 escoba");
  });

  it("formats preview and resolution messages", () => {
    // Given move context, when building preview/resolution text, then descriptions stay consistent.
    const handCard = { rank: "7", suit: "oros" };

    expect(GAME_MESSAGES.PREVIEW_DISCARD(handCard)).toBe(
      "Preview discard: play 7 of oros to table.",
    );
    expect(GAME_MESSAGES.PREVIEW_CAPTURE("7 + 8", 15)).toBe(
      "Preview capture: 7 + 8 = 15.",
    );
    expect(GAME_MESSAGES.PREVIEW_ESCOBA("7 + 8", 15)).toContain("Escoba");

    expect(GAME_MESSAGES.RESOLUTION_DISCARD(handCard)).toBe(
      "Discarded 7 of oros to the table.",
    );
    expect(GAME_MESSAGES.RESOLUTION_CAPTURE(2, "7 + 8", 15)).toBe(
      "Captured 2 card(s): 7 + 8 = 15.",
    );
    expect(GAME_MESSAGES.RESOLUTION_ESCOBA_SUFFIX).toContain("Escoba");
  });
});
