/**
 * Web Worker for async AI computation
 *
 * Runs in background thread to prevent UI blocking during AI move generation
 * Requirement: FR-12.2 (Async AI execution)
 */

self.onmessage = (event) => {
  const { gameState, strategy, config } = event.data;

  // Simulate AI computation
  const move = computeMove(gameState, strategy, config);

  self.postMessage({ move, success: true });
};

function computeMove(gameState, strategy, config) {
  void gameState;
  void strategy;
  void config;

  // Placeholder: actual AI strategy computation
  return { card: null, capture: [] };
}
