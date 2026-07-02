import { describe, expect, it } from "vitest";

import { CONFIG } from "../config/constants.js";

describe("Config Constants", () => {
  it("contains expected default game settings", () => {
    // Given constants are loaded, when reading defaults, then baseline game settings match spec.
    expect(CONFIG.DEFAULT_TARGET_SCORE).toBe(21);
    expect(CONFIG.TARGET_SCORES).toEqual([11, 15, 21, 30]);
    expect(CONFIG.SETENTA_METHODS).toContain(CONFIG.DEFAULT_SETENTA_METHOD);
  });

  it("contains supported AI strategy defaults", () => {
    // Given strategy constants, when enumerated, then supported AI strategies are available.
    expect(CONFIG.AI_STRATEGIES).toContain("greedy");
    expect(CONFIG.AI_STRATEGIES).toContain("negamax");
    expect(CONFIG.AI_STRATEGIES).toContain("mcts");
    expect(CONFIG.DEFAULT_AI_STRATEGY).toBe("greedy");
  });

  it("defines valid card ranks and suits", () => {
    // Given card model constants, when mapped, then suits and rank values align to Escoba rules.
    expect(CONFIG.SUITS).toEqual(["oros", "copas", "espadas", "bastos"]);
    expect(CONFIG.RANKS).toHaveLength(10);

    const values = CONFIG.RANKS.map((r) => r.value);
    expect(values).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

    const keys = CONFIG.RANKS.map((r) => r.key);
    expect(keys).toEqual([
      "as",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "sota",
      "caballo",
      "rey",
    ]);
  });
});
