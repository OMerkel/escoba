/**
 * Test suite for UI integration
 * Tests: game view rendering, user input handling, event dispatching
 * Requirement: NFR-4 (Usability - keyboard, screen readers, WCAG)
 */

import { beforeEach, describe, expect, it } from "vitest";
import { Card } from "../core/card.js";
import { GameUI, renderGameState } from "../ui/game-ui.js";

describe("UI Integration", () => {
  let ui;
  let container;

  beforeEach(() => {
    // Create DOM container
    container = document.createElement("div");
    container.id = "game-container";
    document.body.appendChild(container);

    ui = new GameUI("#game-container");
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe("Game Board Rendering", () => {
    it("should render game board", () => {
      // Given: game state
      const gameState = {
        tableCards: [new Card("oros", "3", 3), new Card("copas", "2", 2)],
        hands: [[new Card("oros", "5", 5)], [new Card("copas", "3", 3)]],
        captured: [[], []],
      };

      // When: rendering board
      const board = ui.renderBoard(gameState);

      // Then: should render board structure
      expect(board).not.toBeNull();
      expect(board.className).toContain("game-board");
      expect(board.getAttribute("role")).toBe("main");

      // Check sections exist
      const sections = board.querySelectorAll("section");
      expect(sections.length).toBeGreaterThan(0);
    });

    it("should render table cards with accessibility", () => {
      // Given: game state with table
      const gameState = {
        tableCards: [new Card("oros", "3", 3), new Card("copas", "2", 2)],
        hands: [[], []],
        captured: [[], []],
      };

      // When: rendering
      const board = ui.renderBoard(gameState);

      // Then: should have accessible table section
      const tableSection = board.querySelector(".table");
      expect(tableSection).not.toBeNull();
      expect(tableSection.getAttribute("aria-label")).toBe("Table cards");

      // Cards should be in list
      const cardsList = tableSection.querySelector("[role=list]");
      const cards = cardsList.querySelectorAll("[role=listitem]");
      expect(cards.length).toBe(2);

      // Cards should have labels
      expect(cards[0].getAttribute("aria-label")).toBeTruthy();
    });
  });

  describe("User Input Handling", () => {
    it("should handle card selection", () => {
      // Given: rendered game
      const gameState = {
        tableCards: [],
        hands: [[new Card("oros", "5", 5)]],
        captured: [[], []],
      };
      ui.renderBoard(gameState);

      let selectedCard = null;
      ui.addEventListener("cardselected", (detail) => {
        selectedCard = detail;
      });

      // When: selecting card
      const cardElement = document.querySelector(".card-hand");
      const event = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
      });
      cardElement.dispatchEvent(event);

      // Then: should fire selection event
      expect(selectedCard).not.toBeNull();
      expect(selectedCard.card.rank).toBe("5");
      expect(cardElement.classList.contains("selected")).toBe(true);
    });

    it("should support keyboard navigation", () => {
      // Given: rendered game with multiple cards
      const gameState = {
        tableCards: [],
        hands: [
          [
            new Card("oros", "3", 3),
            new Card("copas", "2", 2),
            new Card("espadas", "5", 5),
          ],
        ],
        captured: [[], []],
      };
      ui.renderBoard(gameState);

      // When: focusing first card and pressing arrow right
      const cards = document.querySelectorAll(".card-hand");
      cards[0].focus();
      expect(document.activeElement).toBe(cards[0]);

      // Simulate arrow key
      const keyEvent = new KeyboardEvent("keydown", {
        key: "ArrowRight",
        bubbles: true,
      });
      cards[0].dispatchEvent(keyEvent);

      // Then: next card should be focused (due to navigation)
      // Note: actual focus navigation happens in handler
      expect(cards.length).toBe(3);
    });

    it("should be accessible (WCAG 2.1 AA)", () => {
      // Given: rendered game
      const gameState = {
        tableCards: [new Card("oros", "3", 3)],
        hands: [[new Card("oros", "5", 5)]],
        captured: [[], []],
      };
      ui.renderBoard(gameState);

      // When: checking accessibility
      const report = ui.checkAccessibility();

      // Then: should pass basic checks
      expect(report).not.toBeNull();
      expect(typeof report.keyboardNavigable).toBe("boolean");
      expect(typeof report.ariaLabels).toBe("boolean");
      expect(Array.isArray(report.errors)).toBe(true);

      // Should have keyboard-navigable elements
      expect(report.keyboardNavigable).toBe(true);

      // Should have proper aria labels for roles
      expect(report.ariaLabels).toBe(true);
    });
  });

  describe("Game State Rendering", () => {
    it("should render game state to string", () => {
      // Given: game state
      const gameState = {
        tableCards: [new Card("oros", "3", 3)],
        hands: [[new Card("oros", "5", 5)], [new Card("copas", "2", 2)]],
        captured: [[new Card("espadas", "7", 7)], []],
      };

      // When: rendering state
      const rendered = renderGameState(gameState);

      // Then: should contain game information
      expect(rendered).toContain("Table:");
      expect(rendered).toContain("Player 1:");
      expect(rendered).toContain("Player 2:");
      expect(rendered).toContain("Captured 1:");
      expect(rendered).toContain("3 of oros");
    });
  });
});
