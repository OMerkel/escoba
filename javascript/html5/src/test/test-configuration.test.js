/**
 * Test suite for Configuration
 * Tests: config loading, validation, defaults, presets
 * Requirement: FR-11 (Game Configuration), FR-17 (AI Configuration)
 */

import { describe, expect, it } from "vitest";
import {
  createConfiguration,
  DEFAULT_MANDATORY_CAPTURE_DISPLAY_DURATION_MS,
  getConfigurationPreset,
  loadConfiguration,
  validateConfiguration,
} from "../config/configuration.js";

describe("Configuration", () => {
  it("should load default configuration", () => {
    // Given: no configuration
    // When: loading default
    const config = loadConfiguration({});

    // Then: should have default values
    expect(config.targetScore).toBe(21);
    expect(config.setentaMethod).toBe("numerical");
    expect(config.aiStrategy).toBe("greedy");
    expect(config.enableFinalCardEscoba).toBe(false);
    expect(config.mandatoryCaptureDisplayDurationMs).toBe(
      DEFAULT_MANDATORY_CAPTURE_DISPLAY_DURATION_MS,
    );
  });

  it("should merge custom values with defaults", () => {
    // Given: custom configuration
    const custom = { targetScore: 15, setentaMethod: "prime" };

    // When: loading with overrides
    const config = loadConfiguration(custom);

    // Then: should have mixed values
    expect(config.targetScore).toBe(15);
    expect(config.setentaMethod).toBe("prime");
    expect(config.aiStrategy).toBe("greedy"); // default preserved
  });

  it("should validate correct configuration", () => {
    // Given: valid configuration
    const config = {
      targetScore: 21,
      setentaMethod: "numerical",
      aiResponseTime: 5000,
    };

    // When: validating
    const result = validateConfiguration(config);

    // Then: should be valid
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it("should reject invalid target score", () => {
    // Given: config with out-of-range targetScore
    const config = { targetScore: 100 }; // exceeds max of 30

    // When: validating
    const result = validateConfiguration(config);

    // Then: should be invalid
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("should reject invalid setenta method", () => {
    // Given: config with invalid method
    const config = { setentaMethod: "invalid" };

    // When: validating
    const result = validateConfiguration(config);

    // Then: should be invalid
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("setentaMethod"))).toBe(true);
  });

  it("should support custom target scores (15, 21, 30)", () => {
    // Given: custom target scores
    const scores = [15, 21, 30];

    // When: creating configs with each
    const configs = scores.map((score) =>
      createConfiguration({ targetScore: score }),
    );

    // Then: all should be valid
    configs.forEach((cfg, idx) => {
      expect(cfg.targetScore).toBe(scores[idx]);
    });
  });

  it("should support numerical setenta method", () => {
    // Given: numerical setenta config
    // When: creating config
    const config = createConfiguration({ setentaMethod: "numerical" });

    // Then: should accept it
    expect(config.setentaMethod).toBe("numerical");
  });

  it("should support prime setenta method", () => {
    // Given: prime setenta config
    // When: creating config
    const config = createConfiguration({ setentaMethod: "prime" });

    // Then: should accept it
    expect(config.setentaMethod).toBe("prime");
  });

  it("should support simplified setenta method", () => {
    // Given: simplified setenta config
    // When: creating config
    const config = createConfiguration({ setentaMethod: "simplified" });

    // Then: should accept it
    expect(config.setentaMethod).toBe("simplified");
  });

  it("should load standard preset configuration", () => {
    // Given: standard preset
    // When: loading preset
    const config = getConfigurationPreset("standard");

    // Then: should have standard values
    expect(config.targetScore).toBe(21);
    expect(config.aiStrategy).toBe("negamax");
  });

  it("should load quick preset configuration", () => {
    // Given: quick preset
    // When: loading preset
    const config = getConfigurationPreset("quick");

    // Then: should have quick values
    expect(config.targetScore).toBe(15);
    expect(config.aiStrategy).toBe("greedy");
  });

  it("should load tournament preset configuration", () => {
    // Given: tournament preset
    // When: loading preset
    const config = getConfigurationPreset("tournament");

    // Then: should have tournament values
    expect(config.targetScore).toBe(30);
    expect(config.aiStrategy).toBe("mcts");
    expect(config.mctsRolloutsPerDecision).toBe(2000);
  });

  it("should throw on unknown preset", () => {
    // Given: unknown preset name
    // When: loading preset
    // Then: should throw error
    expect(() => getConfigurationPreset("unknown")).toThrow();
  });

  it("should throw on invalid configuration", () => {
    // Given: invalid config
    const invalid = { targetScore: 100, setentaMethod: "invalid" };

    // When: creating config
    // Then: should throw
    expect(() => createConfiguration(invalid)).toThrow();
  });

  it("should support configurable mandatory capture display duration", () => {
    const config = createConfiguration({
      mandatoryCaptureDisplayDurationMs: 6000,
    });
    expect(config.mandatoryCaptureDisplayDurationMs).toBe(6000);
  });

  it("should reject too-small mandatory capture display duration", () => {
    const result = validateConfiguration({
      mandatoryCaptureDisplayDurationMs: 500,
    });
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) =>
        e.includes("mandatoryCaptureDisplayDurationMs"),
      ),
    ).toBe(true);
  });
});
