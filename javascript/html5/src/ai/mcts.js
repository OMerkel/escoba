/**
 * Monte Carlo Tree Search Algorithm
 * Implements MCTS with UCB1 selection and random rollouts
 * Requirement: FR-15.1c (MCTS AI strategy)
 */

import { selectGreedyMove } from "./ai-strategy.js";

/**
 * MCTS Node in the search tree
 * @class MCTSNode
 */
export class MCTSNode {
  constructor(move = null, parent = null) {
    this.move = move; // Move that led to this node
    this.parent = parent;
    this.children = [];
    this.visits = 0;
    this.wins = 0; // Total wins from this node
  }

  /**
   * Add child node
   * @param {MCTSNode} child
   */
  addChild(child) {
    this.children.push(child);
  }

  /**
   * Update node statistics
   * @param {number} reward - Reward from simulation
   */
  update(reward) {
    this.visits += 1;
    this.wins += reward;
  }

  /**
   * Get UCB1 value for selection
   * @param {number} exploration - Exploration constant (typically sqrt(2))
   * @returns {number} UCB1 score
   */
  getUCB1(exploration = Math.sqrt(2)) {
    if (this.visits === 0) return Number.POSITIVE_INFINITY;

    const exploitation = this.wins / this.visits;
    const exploration_term =
      exploration * Math.sqrt(Math.log(this.parent.visits) / this.visits);

    return exploitation + exploration_term;
  }

  /**
   * Get best child using UCB1
   * @param {number} exploration - Exploration constant
   * @returns {MCTSNode} Best child node
   */
  selectBestChild(exploration = Math.sqrt(2)) {
    if (this.children.length === 0) return null;

    let bestChild = this.children[0];
    let bestUCB = bestChild.getUCB1(exploration);

    for (let i = 1; i < this.children.length; i++) {
      const ucb = this.children[i].getUCB1(exploration);
      if (ucb > bestUCB) {
        bestUCB = ucb;
        bestChild = this.children[i];
      }
    }

    return bestChild;
  }

  /**
   * Get move with highest win rate
   * @returns {MCTSNode} Best exploited child
   */
  getBestExploitedChild() {
    if (this.children.length === 0) return null;

    return this.children.reduce((best, current) => {
      const bestWinRate = best.visits > 0 ? best.wins / best.visits : 0;
      const currentWinRate =
        current.visits > 0 ? current.wins / current.visits : 0;
      return currentWinRate > bestWinRate ? current : best;
    });
  }
}

/**
 * Generate random moves for simulation
 * @param {Object[]} hand - Player's hand
 * @param {Object[]} tableCards - Table cards
 * @returns {Object} Random move
 */
export function generateRandomMove(hand, tableCards) {
  void tableCards;
  if (!hand || hand.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * hand.length);
  return { card: hand[randomIndex], isCapture: false };
}

/**
 * Simulate random game from state
 * Returns result (win=1, loss=0, draw=0.5)
 *
 * @param {Object} gameState - Game state
 * @returns {number} Simulation result
 */
export function simulateRandomGame(gameState) {
  if (!gameState) return 0.5;

  // Simple heuristic: compare scores
  const scores = gameState.scores || [0, 0];
  const diff = scores[0] - scores[1];

  // Return normalized result
  if (diff > 0) return 1.0; // Player 1 winning
  if (diff < 0) return 0.0; // Player 2 winning
  return 0.5; // Draw
}

/**
 * Select node in tree using UCB1
 * Traverse until reaching unexplored node
 *
 * @param {MCTSNode} root - Root node
 * @returns {MCTSNode} Selected node
 */
export function selectNode(root) {
  let current = root;

  while (current.children.length > 0) {
    const allChildrenVisited = current.children.every((c) => c.visits > 0);

    if (!allChildrenVisited) {
      // Return unvisited child
      return current.children.find((c) => c.visits === 0);
    }

    // All children visited, select best via UCB1
    current = current.selectBestChild();
  }

  return current;
}

/**
 * Expand node with one new child
 * Create child node for one unvisited move
 *
 * @param {MCTSNode} node - Node to expand
 * @param {Object[]|Card[]} hand - Available moves or cards
 * @returns {MCTSNode} New child node
 */
export function expandNode(node, hand) {
  if (!node || !hand || hand.length === 0) return node;

  // Create child nodes for all moves
  for (const item of hand) {
    // Convert Card to move if needed
    const move =
      item.isCapture !== undefined ? item : { card: item, isCapture: false };
    const child = new MCTSNode(move, node);
    node.addChild(child);
  }

  // Return first unvisited child for simulation
  return node.children[0] || node;
}

/**
 * MCTS search iteration: Selection -> Expansion -> Simulation -> Backpropagation
 *
 * @param {MCTSNode} root - Root node
 * @param {Object} gameState - Current game state
 * @param {Object[]} hand - Available moves
 * @param {Object[]} tableCards - Table cards
 * @returns {MCTSNode} Simulated node
 */
export function mctsIteration(root, gameState, hand, tableCards) {
  void tableCards;
  // Selection: traverse tree
  const selected = selectNode(root);

  // Expansion: grow tree
  let expanded = selected;
  if (selected.children.length === 0) {
    expanded = expandNode(selected, hand);
  }

  // Simulation: random rollout
  const result = simulateRandomGame(gameState);

  // Backpropagation: update statistics
  let current = expanded;
  while (current != null) {
    current.update(result);
    current = current.parent;
  }

  return expanded;
}

/**
 * MCTS search with time limit
 * Perform multiple iterations until time limit reached
 *
 * @param {Object} gameState - Game state
 * @param {Object[]} hand - Player's hand
 * @param {Object[]} tableCards - Table cards
 * @param {number} maxTime - Maximum time in ms
 * @param {number} iterations - Minimum iterations before time check
 * @returns {Object} Best move found
 */
export function mctsSearch(
  gameState,
  hand,
  tableCards,
  maxTime = 3000,
  iterations = 100,
) {
  const root = new MCTSNode();

  // Expand root with available moves
  expandNode(root, hand);

  const startTime = Date.now();
  let iterationCount = 0;

  // Run iterations until time limit or max iterations
  while (iterationCount < iterations) {
    const elapsed = Date.now() - startTime;
    if (elapsed > maxTime && iterationCount > 10) {
      // Stop if time exceeded and at least 10 iterations done
      break;
    }

    mctsIteration(root, gameState, hand, tableCards);
    iterationCount += 1;
  }

  // Select best move from root children
  const bestChild = root.getBestExploitedChild();
  return bestChild
    ? bestChild.move
    : selectGreedyMove(hand, tableCards, gameState);
}

/**
 * MCTS strategy function for AI manager
 *
 * @param {Object[]} hand - Player's hand
 * @param {Object[]} tableCards - Table cards
 * @param {Object} gameState - Game state
 * @param {Object} config - Configuration
 * @returns {Object} Selected move
 */
export function selectMCTSMove(hand, tableCards, gameState, config = {}) {
  const maxTime = config.aiResponseTime || 3000;
  const iterations = config.mctsIterations || 100;

  const move = mctsSearch(gameState, hand, tableCards, maxTime, iterations);
  return move || selectGreedyMove(hand, tableCards, gameState);
}
