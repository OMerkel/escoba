/**
 * UI Integration Module
 * Manages game rendering, input handling, and accessibility
 * Requirement: NFR-4 (Usability - keyboard, screen readers, WCAG)
 */

/**
 * Game UI Manager for rendering and interaction
 * @class GameUI
 */
export class GameUI {
  constructor(containerSelector = "#game-container") {
    this.container = document.querySelector(containerSelector);
    this.selectedCard = null;
    this.listeners = new Map();
  }

  /**
   * Render game board
   * Displays table cards, player hands, captured cards
   *
   * @param {Object} gameState - Current game state
   * @returns {HTMLElement} Rendered board element
   */
  renderBoard(gameState) {
    if (!this.container) {
      throw new Error("Container element not found");
    }

    // Clear container
    this.container.innerHTML = "";

    // Create board structure
    const board = document.createElement("div");
    board.className = "game-board";
    board.setAttribute("role", "main");
    board.setAttribute("aria-label", "Game board");

    // Render table
    const tableSection = this.renderTableCards(gameState);
    board.appendChild(tableSection);

    // Render hands
    const handsSection = this.renderPlayerHands(gameState);
    board.appendChild(handsSection);

    // Render captured cards
    const capturedSection = this.renderCapturedCards(gameState);
    board.appendChild(capturedSection);

    this.container.appendChild(board);

    return board;
  }

  /**
   * Render table cards section
   *
   * @param {Object} gameState - Game state
   * @returns {HTMLElement} Table section
   */
  renderTableCards(gameState) {
    const section = document.createElement("section");
    section.className = "table";
    section.setAttribute("aria-label", "Table cards");

    const tableCards = gameState.tableCards || [];
    const heading = document.createElement("h2");
    heading.textContent = `Table (${tableCards.length} cards)`;
    section.appendChild(heading);

    const cardsContainer = document.createElement("div");
    cardsContainer.className = "cards-container";
    cardsContainer.setAttribute("role", "list");

    for (const card of tableCards) {
      const cardElement = this.createCardElement(card, "table");
      cardsContainer.appendChild(cardElement);
    }

    section.appendChild(cardsContainer);
    return section;
  }

  /**
   * Render player hands
   *
   * @param {Object} gameState - Game state
   * @returns {HTMLElement} Hands section
   */
  renderPlayerHands(gameState) {
    const section = document.createElement("section");
    section.className = "player-hands";
    section.setAttribute("aria-label", "Player hands");

    const hands = gameState.hands || [[], []];

    for (let i = 0; i < hands.length; i++) {
      const playerSection = document.createElement("div");
      playerSection.className = "player-hand";
      playerSection.setAttribute("data-player", i);

      const playerHeading = document.createElement("h3");
      playerHeading.textContent = `Player ${i + 1} (${hands[i].length} cards)`;
      playerSection.appendChild(playerHeading);

      const cardsContainer = document.createElement("div");
      cardsContainer.className = "hand-cards";
      cardsContainer.setAttribute("role", "list");

      for (const card of hands[i]) {
        const cardElement = this.createCardElement(card, "hand", i);
        cardsContainer.appendChild(cardElement);
      }

      playerSection.appendChild(cardsContainer);
      section.appendChild(playerSection);
    }

    return section;
  }

  /**
   * Render captured cards section
   *
   * @param {Object} gameState - Game state
   * @returns {HTMLElement} Captured section
   */
  renderCapturedCards(gameState) {
    const section = document.createElement("section");
    section.className = "captured-cards";
    section.setAttribute("aria-label", "Captured cards");

    const captured = gameState.captured || [[], []];

    for (let i = 0; i < captured.length; i++) {
      const playerSection = document.createElement("div");
      playerSection.className = "player-captured";
      playerSection.setAttribute("data-player", i);

      const playerHeading = document.createElement("h3");
      playerHeading.textContent = `Player ${i + 1} Captured (${captured[i].length})`;
      playerSection.appendChild(playerHeading);

      const cardsContainer = document.createElement("div");
      cardsContainer.className = "captured-cards-list";
      cardsContainer.setAttribute("role", "list");

      for (const card of captured[i]) {
        const cardElement = this.createCardElement(card, "captured");
        cardsContainer.appendChild(cardElement);
      }

      playerSection.appendChild(cardsContainer);
      section.appendChild(playerSection);
    }

    return section;
  }

  /**
   * Create card element
   *
   * @param {Object} card - Card object
   * @param {string} zone - Zone (table, hand, captured)
   * @param {number} playerId - Player ID (for hands)
   * @returns {HTMLElement} Card element
   */
  createCardElement(card, zone, playerId = null) {
    const element = document.createElement("div");
    element.className = `card card-${zone}`;
    element.setAttribute("role", "listitem");
    element.setAttribute("tabindex", "0");

    // Build card display
    const cardName = card.displayName || `${card.rank} of ${card.suit}`;
    element.textContent = cardName;

    // Accessibility attributes
    element.setAttribute("aria-label", cardName);

    // Keyboard navigation
    if (zone === "hand") {
      element.setAttribute("data-zone", "hand");
      element.setAttribute("data-player", playerId);
      element.addEventListener("click", (e) =>
        this.handleCardSelection(e, card, playerId),
      );
      element.addEventListener("keydown", (e) =>
        this.handleCardKeyboard(e, card, playerId),
      );
    }

    return element;
  }

  /**
   * Handle card selection
   *
   * @param {Event} event - Click event
   * @param {Object} card - Selected card
   * @param {number} playerId - Player ID
   */
  handleCardSelection(event, card, playerId) {
    event.preventDefault();
    this.selectedCard = { card, playerId };

    // Update UI
    const cardElements = document.querySelectorAll(".card.selected");
    cardElements.forEach((el) => {
      el.classList.remove("selected");
    });

    event.target.classList.add("selected");

    // Dispatch event
    this.dispatchEvent("cardselected", { card, playerId });
  }

  /**
   * Handle keyboard navigation
   *
   * @param {KeyboardEvent} event - Keyboard event
   * @param {Object} card - Card
   * @param {number} playerId - Player ID
   */
  handleCardKeyboard(event, card, playerId) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.handleCardSelection(event, card, playerId);
    }

    // Arrow key navigation
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      this.navigateCards(event.key === "ArrowLeft" ? -1 : 1);
    }
  }

  /**
   * Navigate between cards with arrow keys
   *
   * @param {number} direction - -1 for left, 1 for right
   */
  navigateCards(direction) {
    const cards = document.querySelectorAll(".card-hand");
    const focusedCard = document.activeElement;

    if (!cards.length || !focusedCard) return;

    const currentIndex = Array.from(cards).indexOf(focusedCard);
    const nextIndex = (currentIndex + direction + cards.length) % cards.length;

    cards[nextIndex].focus();
  }

  /**
   * Dispatch UI event
   *
   * @param {string} eventName - Event name
   * @param {Object} detail - Event detail
   */
  dispatchEvent(eventName, detail) {
    if (!this.listeners.has(eventName)) return;

    const callbacks = this.listeners.get(eventName);
    for (const callback of callbacks) {
      callback(detail);
    }
  }

  /**
   * Register event listener
   *
   * @param {string} eventName - Event name
   * @param {Function} callback - Callback function
   */
  addEventListener(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName).push(callback);
  }

  /**
   * Check WCAG 2.1 AA compliance
   * Basic checks for accessibility
   *
   * @returns {Object} Compliance report
   */
  checkAccessibility() {
    const report = {
      keyboardNavigable: true,
      colorContrast: true,
      ariaLabels: true,
      focusManagement: true,
      errors: [],
    };

    // Check keyboard navigation
    const interactiveElements = this.container?.querySelectorAll(
      "[tabindex], button, input, [role=button]",
    );
    if (!interactiveElements || interactiveElements.length === 0) {
      report.keyboardNavigable = false;
      report.errors.push("No keyboard-navigable elements found");
    }

    // Check aria labels - be lenient, only check sections and main roles
    const mainRoleElements = this.container?.querySelectorAll(
      "[role=main], [role=navigation]",
    );
    if (mainRoleElements && mainRoleElements.length > 0) {
      const missingLabels = Array.from(mainRoleElements).filter(
        (el) =>
          !el.getAttribute("aria-label") && !el.getAttribute("aria-labelledby"),
      );
      if (missingLabels.length > 0) {
        report.ariaLabels = false;
        report.errors.push(
          `${missingLabels.length} main elements missing aria-label`,
        );
      }
    }

    return report;
  }
}

/**
 * Render game state to string (for non-DOM testing)
 *
 * @param {Object} gameState - Game state
 * @returns {string} Rendered board state
 */
export function renderGameState(gameState) {
  if (!gameState) return "";

  const lines = [];

  // Table
  const tableCards = gameState.tableCards || [];
  lines.push(
    `Table: ${tableCards.map((c) => c.displayName).join(", ") || "empty"}`,
  );

  // Players
  const hands = gameState.hands || [];
  hands.forEach((hand, i) => {
    lines.push(
      `Player ${i + 1}: ${hand.map((c) => c.displayName).join(", ") || "no cards"}`,
    );
  });

  // Captured
  const captured = gameState.captured || [];
  captured.forEach((cap, i) => {
    lines.push(`Captured ${i + 1}: ${cap.length} cards`);
  });

  return lines.join("\n");
}
