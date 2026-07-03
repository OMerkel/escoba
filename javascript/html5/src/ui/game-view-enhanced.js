/**
 * Enhanced Game View - Complete UI Implementation
 * Manages game flow, difficulty selection, statistics, and board rendering
 */

import { Logger } from "../utils/logger.js";
import { DifficultySelector } from "./components/difficulty-selector.js";
import { GameBoard } from "./components/game-board.js";
import { StatisticsPanel } from "./components/statistics-panel.js";

const logger = new Logger("escoba:game-view");

export class GameView {
  constructor(container, eventBus) {
    this.container = container;
    this.eventBus = eventBus;
    this.gameState = null;
    this.currentView = "menu"; // 'menu', 'game', 'results'
    this.selectedDifficulty = null;
    this.difficultySelector = null;
    this.statisticsPanel = new StatisticsPanel();
    this.gameBoard = null;
    this.deckName = "baraja_espanola";
    this.boardStatus = null;
  }

  /**
   * Main render method - dispatches to appropriate view
   */
  render(gameState) {
    this.gameState = gameState;

    if (this.currentView === "menu") {
      this.renderMenu();
    } else if (this.currentView === "game") {
      this.renderGame();
    } else if (this.currentView === "results") {
      this.renderResults();
    }
  }

  /**
   * Render difficulty selection menu
   */
  renderMenu() {
    this.container.innerHTML = "";

    // Main menu container
    const menuContainer = document.createElement("div");
    menuContainer.className = "menu-container";

    // Title
    const titleSection = document.createElement("div");
    titleSection.className = "menu-title";
    titleSection.innerHTML = `
      <h1>🎴 Escoba de Quince</h1>
      <p>Spanish Card Game - Beat the AI</p>
    `;
    menuContainer.appendChild(titleSection);

    // Difficulty selector
    this.difficultySelector = new DifficultySelector((difficulty) =>
      this.selectDifficulty(difficulty),
    );
    const difficultyEl = this.difficultySelector.createElement();
    menuContainer.appendChild(difficultyEl);

    // Statistics panel
    const statsEl = this.statisticsPanel.createElement();
    menuContainer.appendChild(statsEl);

    // Instructions
    const instructions = document.createElement("div");
    instructions.className = "menu-instructions";
    instructions.innerHTML = `
      <h3>How to Play</h3>
      <ul>
        <li><strong>Objective:</strong> Score 21 points with a 2-point lead to win</li>
        <li><strong>Scoring:</strong> Most cards, most oros (golds), 7-of-Oros, and escobas (sweeps)</li>
        <li><strong>Capture:</strong> Play cards to capture matching values from the table</li>
        <li><strong>Discard:</strong> If you can't capture, discard a card</li>
        <li><strong>Escoba:</strong> Clear the table completely to score a sweep!</li>
        <li><strong>Win Condition:</strong> First to 21+ points with at least 2-point lead (e.g., 21-19 wins)</li>
      </ul>
    `;
    menuContainer.appendChild(instructions);

    this.container.appendChild(menuContainer);
    logger.info("Menu rendered");
  }

  /**
   * Handle difficulty selection
   */
  selectDifficulty(difficulty) {
    logger.info(`Difficulty selected: ${difficulty}`);
    this.selectedDifficulty = difficulty;

    // Dispatch event for game controller to handle game initialization
    this.eventBus.emit("difficulty-selected", { difficulty });
    // GameController will call render() with proper game state
  }

  /**
   * Render active game board
   */
  renderGame() {
    this.container.innerHTML = "";

    const gameContainer = document.createElement("div");
    gameContainer.className = "game-container";

    // Create game board
    this.gameBoard = new GameBoard(
      this.gameState,
      this.deckName,
      this.playerTypes || ["human", "ai"],
      this.boardStatus,
    );
    const boardElement = this.gameBoard.createElement();

    // Wire up move handler
    this.gameBoard.onMoveSelected = (selectedCards) => {
      logger.info(
        `Move attempted with ${selectedCards.length} cards`,
        selectedCards,
      );
      this.eventBus.emit("player-move", { cards: selectedCards });
      this.gameBoard.clearSelection();
    };

    gameContainer.appendChild(boardElement);
    this.container.appendChild(gameContainer);

    logger.info("Game board rendered");
  }

  /**
   * Render game results
   */
  renderResults(winner, playerScore, aiScore) {
    this.container.innerHTML = "";

    const resultsContainer = document.createElement("div");
    resultsContainer.className = "results-container";

    // Result header
    const resultHeader = document.createElement("div");
    resultHeader.className = "results-header";

    if (winner === "player") {
      resultHeader.innerHTML = `
        <h2>🎉 You Won!</h2>
        <p>Congratulations! Well played!</p>
      `;
      resultHeader.classList.add("results-win");
    } else {
      resultHeader.innerHTML = `
        <h2>🤖 AI Won</h2>
        <p>Better luck next time!</p>
      `;
      resultHeader.classList.add("results-loss");
    }

    resultsContainer.appendChild(resultHeader);

    // Score summary
    const scoreSummary = document.createElement("div");
    scoreSummary.className = "results-summary";
    scoreSummary.innerHTML = `
      <div class="result-score">
        <h3>Your Score</h3>
        <p class="score-value">${playerScore}</p>
      </div>
      <div class="result-score">
        <h3>AI Score</h3>
        <p class="score-value">${aiScore}</p>
      </div>
    `;
    resultsContainer.appendChild(scoreSummary);

    const effectiveDifficulty = this.selectedDifficulty || "medium";

    // Statistics update
    const wasWin = winner === "player";
    this.statisticsPanel.recordGame(effectiveDifficulty, wasWin, playerScore);

    // Stats display
    const statsDisplay = document.createElement("div");
    statsDisplay.className = "results-stats";
    const stat = this.statisticsPanel.stats[effectiveDifficulty];
    statsDisplay.innerHTML = `
      <p><strong>Difficulty:</strong> ${effectiveDifficulty.charAt(0).toUpperCase() + effectiveDifficulty.slice(1)}</p>
      <p><strong>Record vs ${effectiveDifficulty}:</strong> ${stat.wins}W - ${stat.losses}L</p>
      <p><strong>Win Rate:</strong> ${this.statisticsPanel.getWinRate(effectiveDifficulty)}</p>
    `;
    resultsContainer.appendChild(statsDisplay);

    // Action buttons
    const actions = document.createElement("div");
    actions.className = "results-actions";

    const playAgainBtn = document.createElement("button");
    playAgainBtn.textContent = "Play Again";
    playAgainBtn.className = "btn btn-primary";
    playAgainBtn.addEventListener("click", () => {
      this.currentView = "game";
      this.eventBus.emit("new-game-requested", {
        difficulty: this.selectedDifficulty,
      });
    });

    actions.appendChild(playAgainBtn);
    resultsContainer.appendChild(actions);

    this.container.appendChild(resultsContainer);
    logger.info("Results screen rendered");
  }

  /**
   * Show blocking round-end summary overlay and resolve when OK is pressed
   */
  showRoundSummaryOverlay(summary) {
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.className = "round-summary-overlay";
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");
      overlay.setAttribute("aria-label", "Round summary");

      const [p1Label, p2Label] = summary.playerLabels || [
        "Player 1",
        "Player 2",
      ];
      const winnerLabel =
        summary.isGameOver && typeof summary.winnerIndex === "number"
          ? summary.playerLabels?.[summary.winnerIndex] ||
            `Player ${summary.winnerIndex + 1}`
          : null;

      const rowsHtml = summary.categories
        .map((cat) => {
          const rawLeft = Array.isArray(cat.raw) ? cat.raw[0] : "";
          const rawRight = Array.isArray(cat.raw) ? cat.raw[1] : "";
          const rawFullLeft = Array.isArray(cat.rawFull) ? cat.rawFull[0] : "";
          const rawFullRight = Array.isArray(cat.rawFull) ? cat.rawFull[1] : "";
          const leftTitle = rawFullLeft
            ? ` title="${String(rawFullLeft).replace(/"/g, "&quot;")}"`
            : "";
          const rightTitle = rawFullRight
            ? ` title="${String(rawFullRight).replace(/"/g, "&quot;")}"`
            : "";

          return `
            <tr>
              <td>${cat.label}</td>
              <td${leftTitle}>${rawLeft}</td>
              <td${rightTitle}>${rawRight}</td>
              <td><strong>${cat.points[0]}</strong></td>
              <td><strong>${cat.points[1]}</strong></td>
            </tr>
          `;
        })
        .join("");

      overlay.innerHTML = `
        <div class="round-summary-panel">
          <h2>Round ${summary.round} Summary</h2>
          <p class="round-summary-subtitle">Scoring Categories and Points</p>

          <div class="round-summary-table-wrap">
            <table class="round-summary-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>${p1Label}</th>
                  <th>${p2Label}</th>
                  <th>${p1Label} Points</th>
                  <th>${p2Label} Points</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
                <tr class="round-summary-total-row">
                  <td>Round Total</td>
                  <td>-</td>
                  <td>-</td>
                  <td>${summary.roundPoints[0]}</td>
                  <td>${summary.roundPoints[1]}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="round-summary-accumulated">
            <h3>Accumulated Score</h3>
            <p>${p1Label}: <strong>${summary.totals[0]}</strong></p>
            <p>${p2Label}: <strong>${summary.totals[1]}</strong></p>
          </div>

          ${
            summary.isGameOver
              ? `<p class="round-summary-winner">Congratulations ${winnerLabel}! Win condition reached.</p>`
              : `<p class="round-summary-next">Press OK to continue with the next round.</p>`
          }

          <div class="round-summary-actions">
            <button class="btn btn-primary" id="round-summary-ok">OK</button>
          </div>
        </div>
      `;

      const onOk = () => {
        overlay.remove();
        resolve();
      };

      overlay
        .querySelector("#round-summary-ok")
        ?.addEventListener("click", onOk);
      document.body.appendChild(overlay);
      overlay.querySelector("#round-summary-ok")?.focus();
    });
  }

  /**
   * Update game board display with new game state
   */
  updateGameBoard(gameState = null) {
    // Use provided gameState or fallback to current gameState
    if (gameState) {
      this.gameState = gameState;
    }

    if (this.currentView === "game" && this.gameBoard && this.gameState) {
      // Use the render() method which properly clears selections and updates state
      const boardContainer = this.container.querySelector(".game-container");
      if (boardContainer) {
        this.gameBoard.playerTypes = this.playerTypes || ["human", "ai"];
        this.gameBoard.boardStatus = this.boardStatus;
        this.gameBoard.render(boardContainer, this.gameState, this.boardStatus);

        // Re-wire move handler after render
        this.gameBoard.onMoveSelected = (selectedCards) => {
          logger.info(
            `Move attempted with ${selectedCards.length} cards`,
            selectedCards,
          );
          this.eventBus.emit("player-move", { cards: selectedCards });
        };
      }
    }
  }

  /**
   * Show message to player (only one at a time, with 1s pause between)
   */
  showMessage(message, type = "info") {
    // Remove any existing message first
    const existingMessage = this.container.querySelector(".game-message");
    if (existingMessage) {
      clearTimeout(existingMessage._hideTimeout);
      existingMessage.remove();

      // Add 1 second pause before showing new message if one was already displayed
      setTimeout(() => this._displayMessage(message, type), 1000);
      return;
    }

    // No existing message, show immediately
    this._displayMessage(message, type);
  }

  /**
   * Internal method to actually display the message
   */
  _displayMessage(message, type) {
    const messageEl = document.createElement("div");
    messageEl.className = `game-message game-message-${type}`;
    messageEl.textContent = message;

    this.container.insertAdjacentElement("afterbegin", messageEl);

    messageEl._hideTimeout = setTimeout(() => {
      messageEl.classList.add("message-fade-out");
      setTimeout(() => messageEl.remove(), 300);
    }, 3000);
  }

  /**
   * Handle AI turn animation
   */
  async showAIThinking() {
    this.showMessage("🤖 AI is thinking...", "info");
    // Simulate thinking time
    return new Promise((resolve) => setTimeout(resolve, 1000));
  }

  /**
   * Show move resolution
   */
  showMoveResolution(moveType, cards) {
    let message = "";
    if (moveType === "capture") {
      message = `📍 Captured ${cards.length} card(s)!`;
    } else if (moveType === "escoba") {
      message = "🧹 ESCOBA! Swept the table!";
    } else if (moveType === "discard") {
      message = "📤 Discarded a card";
    }

    this.showMessage(message, "success");
  }

  /**
   * Set status text inside the table panel
   */
  setBoardStatus(message, type = "info", rerender = true) {
    this.boardStatus = { text: message, type };
    if (rerender) {
      this.updateGameBoard();
    }
  }

  /**
   * Clear table panel status text
   */
  clearBoardStatus(rerender = true) {
    this.boardStatus = null;
    if (rerender) {
      this.updateGameBoard();
    }
  }
}

/* =============================================================================
   MENU & RESULTS STYLES (appended to game.css)
   ============================================================================= */
const menuStyles = `
.menu-container {
  max-width: 900px;
  margin: 0 auto;
  animation: fadeIn 0.5s ease-out;
}

.menu-title {
  text-align: center;
  margin-bottom: 3rem;
  padding: 2rem;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  border: 2px solid var(--color-accent);
  border-radius: 16px;
}

.menu-title h1 {
  font-size: var(--font-size-3xl);
  margin-bottom: 0.5rem;
  color: var(--color-accent-light);
}

.menu-title p {
  font-size: var(--font-size-lg);
  opacity: 0.9;
}

.menu-instructions {
  background: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: 12px;
  padding: var(--spacing-xl);
  margin-top: var(--spacing-xl);
}

.menu-instructions h3 {
  font-size: var(--font-size-2xl);
  color: var(--color-accent-light);
  margin-bottom: var(--spacing-lg);
}

.menu-instructions ul {
  list-style: none;
  padding: 0;
}

.menu-instructions li {
  padding: var(--spacing-md) 0;
  font-size: var(--font-size-base);
  border-bottom: 1px solid rgba(224, 224, 224, 0.1);
}

.menu-instructions li:last-child {
  border-bottom: none;
}

.results-container {
  max-width: 600px;
  margin: 2rem auto;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  border: 2px solid var(--color-accent);
  border-radius: 16px;
  padding: var(--spacing-xl);
  text-align: center;
  animation: slideUp 0.5s ease-out;
}

.results-header {
  margin-bottom: var(--spacing-xl);
}

.results-header h2 {
  font-size: var(--font-size-3xl);
  margin-bottom: var(--spacing-md);
}

.results-win .results-header {
  color: var(--color-easy);
}

.results-loss .results-header {
  color: var(--color-hard);
}

.results-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-lg);
  background: var(--color-surface);
  padding: var(--spacing-lg);
  border-radius: 8px;
  margin-bottom: var(--spacing-lg);
}

.result-score h3 {
  font-size: var(--font-size-lg);
  margin-bottom: var(--spacing-md);
}

.result-score .score-value {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  color: var(--color-accent-light);
}

.results-stats {
  background: rgba(0, 0, 0, 0.2);
  padding: var(--spacing-lg);
  border-radius: 8px;
  margin-bottom: var(--spacing-lg);
  font-size: var(--font-size-base);
}

.results-stats p {
  padding: var(--spacing-sm) 0;
}

.results-actions {
  display: flex;
  gap: var(--spacing-lg);
  justify-content: center;
}

.game-message {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-accent);
  color: var(--color-text-dark);
  padding: 10px 18px;
  border-radius: 8px;
  font-size: calc(1em - 2px);
  font-weight: 600;
  z-index: 1000;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.message-fade-out {
  animation: fadeOut 0.3s ease-out forwards;
}

@keyframes fadeOut {
  to {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
}

.game-message-success {
  background: var(--color-easy);
}

.game-message-error {
  background: var(--color-hard);
}

.round-summary-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.72);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 1rem;
}

.round-summary-panel {
  width: min(980px, 96vw);
  max-height: 92vh;
  overflow: auto;
  background: var(--color-surface);
  border: 2px solid var(--color-accent);
  border-radius: 14px;
  padding: 1.25rem;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
}

.round-summary-panel h2 {
  margin: 0 0 0.25rem 0;
}

.round-summary-subtitle {
  margin-top: 0;
  opacity: 0.9;
}

.round-summary-table-wrap {
  overflow-x: auto;
}

.round-summary-table {
  width: 100%;
  border-collapse: collapse;
  margin: 0.75rem 0;
}

.round-summary-table th,
.round-summary-table td {
  border: 1px solid var(--color-border);
  padding: 0.5rem;
  text-align: center;
}

.round-summary-table th:first-child,
.round-summary-table td:first-child {
  text-align: left;
}

.round-summary-total-row td {
  font-weight: 700;
}

.round-summary-accumulated {
  margin-top: 0.75rem;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.round-summary-accumulated h3 {
  margin-top: 0;
}

.round-summary-winner {
  margin-top: 0.85rem;
  font-weight: 700;
  color: var(--color-easy);
}

.round-summary-next {
  margin-top: 0.85rem;
}

.round-summary-actions {
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .results-actions {
    flex-direction: column;
  }
  
  .results-actions .btn {
    width: 100%;
  }
}
`;

// Inject menu/results styles
if (typeof document !== "undefined") {
  const styleEl = document.createElement("style");
  styleEl.textContent = menuStyles;
  document.head.appendChild(styleEl);
}
