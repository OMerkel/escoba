import { describe, expect, it } from "vitest";
import { playMatch, runTournament } from "./tournament.js";

describe("Tournament - AI Play Testing", () => {
  it("should complete a single match between greedy and negamax", async () => {
    const result = await playMatch("greedy", "negamax", { targetScore: 200 });

    expect(result).toBeDefined();
    expect(result.winner).toBeDefined();
    expect([0, 1, -1]).toContain(result.winner);
    expect(result.player1.score).toBeGreaterThanOrEqual(0);
    expect(result.player2.score).toBeGreaterThanOrEqual(0);
    expect(result.moves).toBeGreaterThan(0);
    expect(result.duration).toBeGreaterThan(0);
  });

  it("should run a 3-match quick tournament for testing", async () => {
    const results = await runTournament("greedy", "negamax", 3, {
      targetScore: 200,
    });

    expect(results).toBeDefined();
    expect(results.results.length).toBe(3);
    expect(results.stats).toBeDefined();
  });

  it("should track tournament statistics", async () => {
    const results = await runTournament("greedy", "negamax", 2, {
      targetScore: 200,
    });

    const s1 = results.stats.strategy1;

    // Total games should equal number of matches
    const s1Total = s1.wins + s1.losses + s1.ties;
    expect(s1Total).toBe(2);

    // Basic stats should be tracked
    expect(s1.avgGameLength).toBeGreaterThan(0);
    expect(s1.avgDuration).toBeGreaterThanOrEqual(0);
  });
});
