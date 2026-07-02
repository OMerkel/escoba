/**
 * Test suite for MCTS AI strategy
 * Tests: UCB1 selection, simulation, backpropagation
 * Requirement: FR-15.1c (MCTS AI strategy)
 */

import { describe, expect, it } from "vitest";
import {
  expandNode,
  generateRandomMove,
  MCTSNode,
  mctsSearch,
  selectMCTSMove,
  selectNode,
  simulateRandomGame,
} from "../ai/mcts.js";
import { Card } from "../core/card.js";

describe("AI Strategy - MCTS", () => {
  describe("MCTS Node", () => {
    it("should perform tree selection with UCB1", () => {
      // Given: MCTS tree with nodes
      const root = new MCTSNode();
      const child1 = new MCTSNode({ card: new Card("oros", "5", 5) }, root);
      const child2 = new MCTSNode({ card: new Card("copas", "3", 3) }, root);

      root.addChild(child1);
      root.addChild(child2);

      // Simulate stats
      child1.visits = 10;
      child1.wins = 8; // 80% win rate
      child2.visits = 10;
      child2.wins = 5; // 50% win rate

      // When: selecting best child via UCB1
      const best = root.selectBestChild();

      // Then: should prefer child1 (higher UCB1)
      expect(best).toBe(child1);
    });

    it("should prefer unvisited nodes in UCB1", () => {
      // Given: tree with visited and unvisited children
      const root = new MCTSNode();
      const visited = new MCTSNode({ card: new Card("oros", "5", 5) }, root);
      const unvisited = new MCTSNode({ card: new Card("copas", "3", 3) }, root);

      root.addChild(visited);
      root.addChild(unvisited);

      visited.visits = 5;
      visited.wins = 2;
      // unvisited.visits = 0 (Infinity UCB1)

      // When: getting UCB1 for unvisited
      const ucb = unvisited.getUCB1();

      // Then: should be Infinity
      expect(ucb).toBe(Number.POSITIVE_INFINITY);
    });

    it("should track statistics via update", () => {
      // Given: new node
      const node = new MCTSNode();

      // When: updating with wins
      node.update(1);
      node.update(1);
      node.update(0);

      // Then: should track visits and wins
      expect(node.visits).toBe(3);
      expect(node.wins).toBe(2);
    });
  });

  describe("Simulation", () => {
    it("should simulate random rollouts", () => {
      // Given: game state
      const gameState = {
        scores: [10, 5],
      };

      // When: simulating
      const result = simulateRandomGame(gameState);

      // Then: should return win (>0.5 since player 1 ahead)
      expect(result).toBeGreaterThan(0.5);
    });

    it("should generate random moves", () => {
      // Given: hand and table
      const hand = [
        new Card("oros", "5", 5),
        new Card("copas", "3", 3),
        new Card("espadas", "7", 7),
      ];
      const tableCards = [];

      // When: generating random move
      const move = generateRandomMove(hand, tableCards);

      // Then: should return move from hand
      expect(move).not.toBeNull();
      expect(hand).toContainEqual(move.card);
    });
  });

  describe("Tree Operations", () => {
    it("should expand tree nodes", () => {
      // Given: node and moves
      const node = new MCTSNode();
      const moves = [new Card("oros", "5", 5), new Card("copas", "3", 3)];

      // When: expanding node
      expandNode(node, moves);

      // Then: should create children for each move
      expect(node.children.length).toBe(2);
      expect(node.children[0].move.card.rank).toBe("5");
      expect(node.children[1].move.card.rank).toBe("3");
    });

    it("should select node via UCB1", () => {
      // Given: MCTS tree
      const root = new MCTSNode();
      const level1 = new MCTSNode({ card: new Card("oros", "5", 5) }, root);
      const level2 = new MCTSNode({ card: new Card("copas", "3", 3) }, level1);

      root.addChild(level1);
      level1.addChild(level2);
      level1.visits = 5;
      level1.wins = 3;

      // When: selecting node
      const selected = selectNode(root);

      // Then: should traverse to unvisited
      expect(selected).toBeDefined();
    });

    it("should backpropagate statistics", () => {
      // Given: tree structure
      const root = new MCTSNode();
      const child = new MCTSNode({ card: new Card("oros", "5", 5) }, root);
      root.addChild(child);

      // When: updating child
      child.update(1);
      // Backprop would happen in mctsIteration

      // Then: child should be updated
      expect(child.visits).toBe(1);
      expect(child.wins).toBe(1);
    });
  });

  describe("MCTS Search", () => {
    it("should perform complete MCTS search", () => {
      // Given: game state
      const gameState = {
        currentPlayerIndex: 0,
        scores: [7, 4],
      };
      const hand = [
        new Card("oros", "5", 5),
        new Card("copas", "3", 3),
        new Card("espadas", "2", 2),
      ];
      const tableCards = [];

      // When: searching
      const move = mctsSearch(gameState, hand, tableCards, 500, 10);

      // Then: should return move
      expect(move).not.toBeNull();
      expect(move.card).toBeDefined();
    });

    it("should respect time limits", () => {
      // Given: search with time constraint
      const gameState = {
        scores: [5, 3],
      };
      const hand = [new Card("oros", "5", 5), new Card("copas", "3", 3)];
      const tableCards = [];
      const maxTime = 300;

      // When: searching with limit
      const startTime = Date.now();
      const move = mctsSearch(gameState, hand, tableCards, maxTime, 50);
      const elapsed = Date.now() - startTime;

      // Then: should complete within reasonable time
      expect(move).not.toBeNull();
      expect(elapsed).toBeLessThan(maxTime * 2); // Allow some overage
    });

    it("should select move using MCTS strategy", () => {
      // Given: strategy parameters
      const hand = [new Card("oros", "5", 5), new Card("copas", "2", 2)];
      const tableCards = [];
      const gameState = {
        currentPlayerIndex: 0,
        scores: [8, 5],
      };
      const config = { aiResponseTime: 500, mctsIterations: 20 };

      // When: selecting move
      const move = selectMCTSMove(hand, tableCards, gameState, config);

      // Then: should return valid move
      expect(move).not.toBeNull();
      expect(move.card).toBeDefined();
    });
  });
});
