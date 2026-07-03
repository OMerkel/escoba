/**
 * Game Board Component
 * Main game rendering with table, player hands, and scores
 */

import { CardComponent } from "./card.js";

export class GameBoard {
  constructor(
    gameState,
    deckName = "baraja_espanola",
    playerTypes = ["human", "ai"],
    boardStatus = null,
  ) {
    this.gameState = gameState;
    this.deckName = deckName;
    this.playerTypes = playerTypes; // ["human"|"ai", "human"|"ai"] — index 0=south, 1=north
    this.boardStatus = boardStatus;
    this.selectedCards = [];
    this.selectedHandCard = null;
    this.selectedHandComponent = null;
    this.onMoveSelected = null;
  }

  /**
   * Render board to container with given game state
   * Updates display to reflect current board state (hands, table, piles)
   */
  render(container, gameState, boardStatus = this.boardStatus) {
    this.gameState = gameState;
    this.boardStatus = boardStatus;
    this.selectedCards = []; // Clear selections when re-rendering
    this.selectedHandCard = null;
    this.selectedHandComponent = null;
    container.innerHTML = "";
    const board = this.createElement();
    container.appendChild(board);
  }

  /**
   * Create full game board element
   * Layout: North hand → Table → South hand
   */
  createElement() {
    const board = document.createElement("div");
    board.className = "game-board";
    board.setAttribute("role", "main");

    // Main game area
    const gameArea = document.createElement("div");
    gameArea.className = "game-area";

    const boardCenter = document.createElement("div");
    boardCenter.className = "game-board-center";

    // North player (index 1) — top
    boardCenter.appendChild(this.createHandArea(1, "north"));

    // Central play area (table)
    boardCenter.appendChild(this.createPlayArea());

    // South player (index 0) — bottom
    boardCenter.appendChild(this.createHandArea(0, "south"));

    gameArea.appendChild(boardCenter);

    board.appendChild(gameArea);
    board.appendChild(this.createGameControls());

    return board;
  }

  /**
   * Compare cards by suit/rank
   */
  isSameCard(a, b) {
    return Boolean(a && b && a.suit === b.suit && a.rank === b.rank);
  }

  /**
   * Check if board is in preview phase
   */
  isPreviewPhase() {
    return (
      this.gameState.phase === "captureDisplay" &&
      Boolean(this.gameState.captureDisplay)
    );
  }

  /**
   * Check if card is the currently previewed played card
   */
  isPreviewPlayedCard(playerIdx, card) {
    const preview = this.gameState.captureDisplay;
    return (
      this.isPreviewPhase() &&
      preview.playerId === playerIdx &&
      this.isSameCard(preview.playedCard, card)
    );
  }

  /**
   * Check if card is part of preview capture set on table
   */
  isPreviewCapturedTableCard(card) {
    const preview = this.gameState.captureDisplay;
    if (!this.isPreviewPhase() || !Array.isArray(preview.tableCards)) {
      return false;
    }

    return preview.tableCards.some((c) => this.isSameCard(c, card));
  }

  /**
   * Get status text shown in table panel
   */
  getTableStatusText() {
    if (this.isPreviewPhase() && this.gameState.captureDisplay?.statusText) {
      return this.gameState.captureDisplay.statusText;
    }

    if (this.boardStatus?.text) {
      return this.boardStatus.text;
    }

    return "Click table cards to capture with your selected hand card";
  }

  /**
   * Get status type shown in table panel
   */
  getTableStatusType() {
    if (this.isPreviewPhase() && this.gameState.captureDisplay?.statusType) {
      return this.gameState.captureDisplay.statusType;
    }

    return this.boardStatus?.type || "info";
  }

  /**
   * Return display label for a player
   */
  _playerLabel(playerIdx, position) {
    const type = this.playerTypes[playerIdx];
    const pos = position === "north" ? "North" : "South";
    return type === "human" ? `Player ${pos}` : `AI ${pos}`;
  }

  /**
   * Create hand area for either player.
   *
   * Hand visibility rules:
   * - Mixed games (Human vs AI or AI vs Human):
   *   * AI player: always show card backs (hidden)
   *   * Human player: show face-up if active, face-down if not active
   *
   * - Same type games (AI vs AI or Human vs Human):
   *   * Active player: show face-up cards
   *   * Non-active player: show card backs (hidden)
   */
  createHandArea(playerIdx, position) {
    const isHuman = this.playerTypes[playerIdx] === "human";
    const isCurrentTurn = this.gameState.currentPlayerIndex === playerIdx;
    const isMixedGame = this.playerTypes[0] !== this.playerTypes[1]; // Different player types
    const label = this._playerLabel(playerIdx, position);
    const hand = this.gameState.players[playerIdx].hand;
    const pile = this.gameState.players[playerIdx].pile;
    const escobas = this.gameState.stats?.escobas?.[playerIdx] ?? 0;

    const area = document.createElement("section");
    area.className = `player-area player-area-${position} ${isHuman ? "player-type-human" : "player-type-ai"}`;
    area.setAttribute("aria-label", `${label} hand`);

    // Section heading as badge row
    const heading = document.createElement("div");
    heading.className = "player-area-label";
    heading.innerHTML = `
      <span class="pa-name">${label}</span>
      <span class="pa-badge pa-hand" title="Cards in hand">🖐️ ${hand.length}</span>
      <span class="pa-badge pa-captured" title="Captured cards">📦 ${pile.length}</span>
      <span class="pa-badge pa-escobas" title="Escobas (sweeps)">🧹 ${escobas}</span>
    `;
    area.appendChild(heading);

    const handSection = document.createElement("div");
    handSection.className = "hand-section";

    const cardsContainer = document.createElement("div");
    cardsContainer.className = `player-hand player-hand-${position}`;

    // Determine whether to show cards face-up or face-down
    // In mixed games: AI always face-down, Human based on turn
    // In same-type games: Based on turn (active=face-up, non-active=face-down)
    const showFaceUp = isMixedGame ? isHuman && isCurrentTurn : isCurrentTurn;

    const previewLocked = this.isPreviewPhase();

    if (hand.length === 0) {
      // No cards in hand
      const empty = document.createElement("p");
      empty.className = "hand-empty";
      empty.textContent = isHuman ? "No cards in hand" : "No cards";
      cardsContainer.appendChild(empty);
    } else if (showFaceUp) {
      // Show face-up, clickable cards (active player, or human in their turn)
      for (const card of hand) {
        const cardComponent = new CardComponent(card, this.deckName);
        const cardElement = cardComponent.createElement({
          clickable: !previewLocked,
          onSelect: (comp) => this.toggleCardSelection(comp),
        });

        if (this.isPreviewPlayedCard(playerIdx, card)) {
          cardElement.classList.add(
            "card-selected",
            "capture-preview-highlight",
          );
        }

        cardsContainer.appendChild(cardElement);
      }
    } else {
      // Show face-down cards (hidden - non-active player, or AI in mixed game)
      for (const card of hand) {
        if (this.isPreviewPlayedCard(playerIdx, card)) {
          const playedCard = new CardComponent(card, this.deckName);
          const playedCardElement = playedCard.createElement({
            clickable: false,
          });
          playedCardElement.classList.add(
            "card-selected",
            "capture-preview-highlight",
          );
          cardsContainer.appendChild(playedCardElement);
          continue;
        }

        const back = document.createElement("div");
        back.className = "card-element card-back";
        back.setAttribute("aria-hidden", "true");
        back.title = "Hidden card";
        const img = document.createElement("img");
        img.src = `img/deck/${this.deckName}/${this.deckName}_back.svg`;
        img.alt = "Card back";
        img.className = "card-image";
        img.loading = "lazy";
        back.appendChild(img);
        cardsContainer.appendChild(back);
      }
    }

    handSection.appendChild(cardsContainer);
    area.appendChild(handSection);

    return area;
  }

  /**
   * Create central play area (table cards)
   */
  createPlayArea() {
    const area = document.createElement("section");
    area.className = "play-area";
    area.setAttribute("aria-label", "Table cards");

    const tableSection = document.createElement("div");
    tableSection.className = "table-section";

    const instruction = document.createElement("p");
    const statusType = this.getTableStatusType();
    instruction.className = `play-area-instruction play-area-status-${statusType}`;
    instruction.textContent = this.getTableStatusText();

    const tableContainer = document.createElement("div");
    tableContainer.className = "table-container";

    const cardsContainer = document.createElement("div");
    cardsContainer.className = "table-cards";
    cardsContainer.setAttribute("role", "list");

    const previewLocked = this.isPreviewPhase();

    for (const card of this.gameState.tableCards) {
      const cardComponent = new CardComponent(card, this.deckName);
      const cardElement = cardComponent.createElement({
        clickable: !previewLocked,
        onSelect: (comp) => this.toggleCardSelection(comp),
      });

      if (this.isPreviewCapturedTableCard(card)) {
        cardElement.classList.add("card-selected", "capture-preview-highlight");
      }

      cardsContainer.appendChild(cardElement);
    }

    if (this.gameState.tableCards.length === 0) {
      const emptyMsg = document.createElement("p");
      emptyMsg.className = "table-empty";
      emptyMsg.textContent = "Table is swept. Discard one from hand!";
      cardsContainer.appendChild(emptyMsg);
    }

    tableContainer.appendChild(cardsContainer);

    // Add remaining deck pile display
    const remainingCount = this.gameState.deck
      ? this.gameState.deck.cards.length
      : 0;
    if (remainingCount > 0) {
      const deckPile = document.createElement("div");
      deckPile.className = "deck-pile";
      deckPile.setAttribute(
        "aria-label",
        `${remainingCount} cards remaining in deck`,
      );

      const cardBack = document.createElement("img");
      cardBack.src = `img/deck/${this.deckName}/${this.deckName}_back.svg`;
      cardBack.alt = "Deck back";
      cardBack.className = "deck-back";
      deckPile.appendChild(cardBack);

      const countOverlay = document.createElement("div");
      countOverlay.className = "deck-count";
      countOverlay.textContent = `${remainingCount}x`;
      deckPile.appendChild(countOverlay);

      tableContainer.appendChild(deckPile);
    }

    tableSection.appendChild(tableContainer);
    tableSection.appendChild(instruction);
    area.appendChild(tableSection);

    return area;
  }

  /**
   * Create game control buttons
   */
  createGameControls() {
    const controls = document.createElement("div");
    controls.className = "game-controls";
    controls.setAttribute("role", "region");
    controls.setAttribute("aria-label", "Game controls");

    const previewLocked = this.isPreviewPhase();

    // Play Card button (handles both capture and discard)
    const playBtn = document.createElement("button");
    playBtn.textContent = "Play Card";
    playBtn.className = "btn btn-primary";
    playBtn.id = "play-btn";
    playBtn.disabled = previewLocked;
    playBtn.addEventListener("click", () => {
      if (this.onMoveSelected) {
        this.onMoveSelected(this.selectedCards);
      }
    });
    controls.appendChild(playBtn);
    return controls;
  }

  /**
   * Toggle card selection
   */
  toggleCardSelection(cardComponent) {
    if (this.isPreviewPhase()) {
      return;
    }

    const cardData = cardComponent.getCardData();
    const currentHand =
      this.gameState?.players?.[this.gameState.currentPlayerIndex]?.hand || [];
    const isHandCard = currentHand.some(
      (c) => c.suit === cardData.suit && c.rank === cardData.rank,
    );

    const index = this.selectedCards.findIndex(
      (c) => c.suit === cardData.suit && c.rank === cardData.rank,
    );

    if (index >= 0) {
      this.selectedCards.splice(index, 1);

      if (
        isHandCard &&
        this.selectedHandCard &&
        this.selectedHandCard.suit === cardData.suit &&
        this.selectedHandCard.rank === cardData.rank
      ) {
        this.selectedHandCard = null;
        this.selectedHandComponent = null;
      }
    } else {
      if (isHandCard && this.selectedHandCard) {
        const previousHandIndex = this.selectedCards.findIndex(
          (c) =>
            c.suit === this.selectedHandCard.suit &&
            c.rank === this.selectedHandCard.rank,
        );
        if (previousHandIndex >= 0) {
          this.selectedCards.splice(previousHandIndex, 1);
        }

        if (
          this.selectedHandComponent &&
          this.selectedHandComponent !== cardComponent &&
          typeof this.selectedHandComponent.setSelected === "function"
        ) {
          this.selectedHandComponent.setSelected(false);
        }
      }

      this.selectedCards.push(cardData);

      if (isHandCard) {
        this.selectedHandCard = { suit: cardData.suit, rank: cardData.rank };
        this.selectedHandComponent = cardComponent;
      }
    }

    // Visual state is already updated by CardComponent.handleSelect
    // This method just tracks the selection in our array

    this.updateSelectedCount();
  }

  /**
   * Update selected count display
   */
  updateSelectedCount() {
    const countEl = document.getElementById("selected-count");
    if (countEl) {
      countEl.textContent = this.selectedCards.length;
    }
  }

  /**
   * Clear selection
   */
  clearSelection() {
    if (this.isPreviewPhase()) {
      return;
    }

    this.selectedCards = [];
    this.selectedHandCard = null;
    this.selectedHandComponent = null;
    const cards = document.querySelectorAll(".card-selected");
    cards.forEach((card) => {
      card.classList.remove("card-selected");
    });
    this.updateSelectedCount();
  }
}
