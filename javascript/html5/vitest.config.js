import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      include: ["src/**/*.js"],
      exclude: [
        "src/test/**",
        "**/*.test.js",
        "**/*.spec.js",
        // App bootstrap and legacy/experimental modules are validated via integration flows.
        "src/index.js",
        "src/ui/game-controller.js",
        "src/ui/game-view.js",
        "src/workers/**",
        "src/ai/ai-baseline.js",
        "src/ai/phase2-endgame.js",
        "src/ai/phase2-enhanced-strategies.js",
      ],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
    include: ["src/test/**/*.test.js"],
  },
});
