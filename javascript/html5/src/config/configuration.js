/**
 * Configuration Module
 * Manages game configuration: target scores, setenta methods, house rules, AI parameters
 * Requirements: FR-11 (Game Configuration), FR-17 (AI Configuration)
 */

/**
 * Default game configuration
 * FR-11: Configurable game parameters
 */
export const DEFAULT_CONFIG = {
  // Game play settings
  targetScore: 21, // FR-11.1: Game ends at 21 points (or configured value)
  setentaMethod: "numerical", // FR-11.2: "numerical", "prime", or "simplified"

  // House rules
  enableFinalCardEscoba: true, // FR-11.3: Award escoba point for final card capture
  initialConditionRules: true, // FR-10: Handle initial 15/30 conditions

  // AI settings
  aiStrategy: "greedy", // "greedy", "negamax", "mcts"
  aiResponseTime: 5000, // milliseconds, FR-12.3
  negamaxTimeout: 4500, // iterative deepening timeout
  mctsRolloutsPerDecision: 1000, // FR-17.1

  // Display/UI settings
  animationEnabled: true,
  soundEnabled: false,
};

/**
 * Configuration validation schema
 */
const VALIDATION_SCHEMA = {
  targetScore: {
    type: "number",
    min: 10,
    max: 30,
    description: "Game target score (10-30)",
  },
  setentaMethod: {
    type: "string",
    enum: ["numerical", "prime", "simplified"],
    description: "Setenta scoring method",
  },
  enableFinalCardEscoba: { type: "boolean" },
  aiStrategy: {
    type: "string",
    enum: ["greedy", "negamax", "mcts"],
    description: "AI strategy",
  },
  aiResponseTime: {
    type: "number",
    min: 500,
    max: 30000,
    description: "AI response time in ms",
  },
  mctsRolloutsPerDecision: {
    type: "number",
    min: 100,
    max: 10000,
    description: "MCTS rollout count per decision",
  },
};

/**
 * Load configuration from JSON object
 * FR-17.3: Load configuration from file
 *
 * @param {Object} configData - Configuration object
 * @returns {Object} Merged configuration with defaults
 */
export function loadConfiguration(configData) {
  if (!configData || typeof configData !== "object") {
    return { ...DEFAULT_CONFIG };
  }

  return {
    ...DEFAULT_CONFIG,
    ...configData,
  };
}

/**
 * Validate configuration against schema
 * FR-17.3: Validate configuration values
 *
 * @param {Object} config - Configuration to validate
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateConfiguration(config) {
  const errors = [];

  if (!config || typeof config !== "object") {
    return { valid: false, errors: ["Configuration must be an object"] };
  }

  // Check each property against schema
  for (const [key, schema] of Object.entries(VALIDATION_SCHEMA)) {
    const value = config[key];

    if (value === undefined) continue; // Optional if using defaults

    // Type check
    const typeMatches =
      (schema.type === "string" && typeof value === "string") ||
      (schema.type === "number" && typeof value === "number") ||
      (schema.type === "boolean" && typeof value === "boolean") ||
      (schema.type === "object" && typeof value === "object") ||
      (schema.type === "function" && typeof value === "function") ||
      (schema.type === "undefined" && typeof value === "undefined") ||
      (schema.type === "bigint" && typeof value === "bigint") ||
      (schema.type === "symbol" && typeof value === "symbol");

    if (!typeMatches) {
      errors.push(`${key}: expected ${schema.type}, got ${typeof value}`);
      continue;
    }

    // Enum validation
    if (schema.enum && !schema.enum.includes(value)) {
      errors.push(
        `${key}: must be one of ${schema.enum.join(", ")}, got "${value}"`,
      );
    }

    // Range validation
    if (schema.min !== undefined && value < schema.min) {
      errors.push(`${key}: must be >= ${schema.min}, got ${value}`);
    }
    if (schema.max !== undefined && value > schema.max) {
      errors.push(`${key}: must be <= ${schema.max}, got ${value}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create configuration with custom values
 * FR-11: Custom game configuration
 *
 * @param {Object} overrides - Configuration overrides
 * @returns {Object} Complete configuration
 */
export function createConfiguration(overrides = {}) {
  const config = loadConfiguration(overrides);

  // Validate the merged config
  const validation = validateConfiguration(config);

  if (!validation.valid) {
    throw new Error(`Invalid configuration: ${validation.errors.join("; ")}`);
  }

  return config;
}

/**
 * Get configuration preset
 * Common game variants
 *
 * @param {string} preset - Preset name: "standard", "quick", "tournament"
 * @returns {Object} Preset configuration
 */
export function getConfigurationPreset(preset) {
  const presets = {
    standard: {
      targetScore: 21,
      setentaMethod: "numerical",
      aiStrategy: "negamax",
      aiResponseTime: 5000,
    },
    quick: {
      targetScore: 15,
      setentaMethod: "simplified",
      aiStrategy: "greedy",
      aiResponseTime: 2000,
    },
    tournament: {
      targetScore: 30,
      setentaMethod: "numerical",
      aiStrategy: "mcts",
      aiResponseTime: 8000,
      mctsRolloutsPerDecision: 2000,
    },
  };

  if (!presets[preset]) {
    throw new Error(
      `Unknown preset: ${preset}. Available: ${Object.keys(presets).join(", ")}`,
    );
  }

  return createConfiguration(presets[preset]);
}
