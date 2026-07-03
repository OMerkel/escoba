/**
 * Main entry point for Escoba de Quince game application
 */

import { DifficultySelector } from "./ui/components/difficulty-selector.js";
import { StatisticsPanel } from "./ui/components/statistics-panel.js";
import { GameController } from "./ui/game-controller.js";
import { GameView } from "./ui/game-view-enhanced.js";
import { EventBus } from "./utils/event-bus.js";
import { Logger } from "./utils/logger.js";

const logger = new Logger("escoba:index");

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    logger.info("Service workers are not supported in this browser");
    return;
  }

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("./sw.js", {
        scope: "./",
      });
      logger.info("Service worker registered", registration.scope);
    } catch (error) {
      logger.warn("Service worker registration failed", error);
    }
  });
}

/**
 * Update the title-bar game badge from current game controller state
 */
function updateGameBadge(gameController) {
  const badge = document.getElementById("game-badge");
  if (!badge) return;

  const gs = gameController.gameState;
  if (!gs || !gameController.gameActive) {
    badge.innerHTML = "";
    return;
  }

  const pt = gameController.playerTypes;
  const p0 = {
    label: pt[0] === "human" ? "Player South" : "AI South",
    icon: pt[0] === "human" ? "🧑" : "🤖",
    score: gs.players[0].score,
  };
  const p1 = {
    label: pt[1] === "human" ? "Player North" : "AI North",
    icon: pt[1] === "human" ? "🧑" : "🤖",
    score: gs.players[1].score,
  };

  const currentIdx = gs.currentPlayerIndex;
  const turnLabel = currentIdx === 0 ? "▼" : "▲";
  const turnIcon = currentIdx === 0 ? p0.icon : p1.icon;

  badge.innerHTML = `
    <span class="badge-turn" title="Current turn"><span class="badge-turn-spinner" aria-hidden="true"></span>${turnIcon}${turnLabel}</span>
    <span class="badge-player ${currentIdx === 0 ? "badge-active" : ""}" title="${p0.label}">
      ${p0.icon} <strong>${p0.score}</strong>
    </span>
    <span class="badge-player ${currentIdx === 1 ? "badge-active" : ""}" title="${p1.label}">
      ${p1.icon} <strong>${p1.score}</strong>
    </span>
  `;
}

/**
 * Build player-type selector HTML for the Options overlay
 */
function buildPlayerTypeSection(gameController) {
  const container = document.getElementById("options-player-types");
  if (!container) return;
  container.innerHTML = "";

  const section = document.createElement("div");
  section.className = "player-type-section";

  const heading = document.createElement("h3");
  heading.textContent = "Players";
  section.appendChild(heading);

  const playerDefs = [
    { idx: 0, label: "Player 1 (Bottom)" },
    { idx: 1, label: "Player 2 (Top)" },
  ];

  for (const { idx, label } of playerDefs) {
    const row = document.createElement("div");
    row.className = "player-type-row";

    const rowLabel = document.createElement("span");
    rowLabel.className = "player-type-label";
    rowLabel.textContent = label;
    row.appendChild(rowLabel);

    const radioGroup = document.createElement("div");
    radioGroup.className = "player-type-radios";

    for (const type of ["human", "ai"]) {
      const id = `pt-p${idx}-${type}`;
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = `player-type-${idx}`;
      radio.value = type;
      radio.id = id;
      radio.checked = gameController.playerTypes[idx] === type;
      radio.dataset.playerIdx = idx;
      radio.dataset.playerType = type;

      const lbl = document.createElement("label");
      lbl.htmlFor = id;
      lbl.textContent = type === "human" ? "🧑 Human" : "🤖 AI";

      radioGroup.appendChild(radio);
      radioGroup.appendChild(lbl);
    }

    row.appendChild(radioGroup);
    section.appendChild(row);
  }

  container.appendChild(section);
}

/**
 * Read currently selected player types from the Options form
 */
function readPlayerTypesFromForm() {
  return [0, 1].map((idx) => {
    const checked = document.querySelector(
      `input[name="player-type-${idx}"]:checked`,
    );
    return checked ? checked.value : null;
  });
}

/**
 * Wire up the side panel and overlay pages
 */
function initSidePanel(gameController) {
  const hamburgerBtn = document.getElementById("hamburger-btn");
  const overlay = document.getElementById("side-panel-overlay");
  const panel = document.getElementById("side-panel");

  // Snapshot of settings when Options overlay is opened
  let optionsSnapshot = null;

  function openPanel() {
    panel.classList.add("open");
    overlay.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    overlay.setAttribute("aria-hidden", "false");
    hamburgerBtn.setAttribute("aria-expanded", "true");
  }

  function closePanel() {
    panel.classList.remove("open");
    overlay.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
    overlay.setAttribute("aria-hidden", "true");
    hamburgerBtn.setAttribute("aria-expanded", "false");
  }

  function openOverlay(id) {
    closePanel();
    const el = document.getElementById(id);
    if (el) {
      el.classList.add("open");
      if (id === "overlay-options") {
        populateOptions(gameController);
        // Take snapshot of current settings
        optionsSnapshot = {
          difficulty: gameController.selectedDifficulty,
          playerTypes: [...gameController.playerTypes],
        };
      }
    }
  }

  function closeOverlay(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove("open");

    if (id === "overlay-options" && optionsSnapshot) {
      // Read new values from the form
      const newPlayerTypes = readPlayerTypesFromForm();

      // Apply player type changes
      newPlayerTypes.forEach((t, i) => {
        if (t) gameController.playerTypes[i] = t;
      });

      // Determine effective difficulty (may have been changed via click)
      const effectiveDifficulty = gameController.selectedDifficulty;

      const changed =
        optionsSnapshot.difficulty !== effectiveDifficulty ||
        optionsSnapshot.playerTypes[0] !== gameController.playerTypes[0] ||
        optionsSnapshot.playerTypes[1] !== gameController.playerTypes[1];

      optionsSnapshot = null;

      if (changed) {
        gameController.startNewGame(effectiveDifficulty);
      }
    }
  }

  hamburgerBtn.addEventListener("click", openPanel);
  overlay.addEventListener("click", closePanel);

  document.getElementById("sp-close").addEventListener("click", closePanel);

  document.getElementById("sp-new-game").addEventListener("click", () => {
    closePanel();
    gameController.startNewGame(gameController.selectedDifficulty || "medium");
  });

  document
    .getElementById("sp-rules")
    .addEventListener("click", () => openOverlay("overlay-rules"));
  document
    .getElementById("sp-options")
    .addEventListener("click", () => openOverlay("overlay-options"));
  document
    .getElementById("sp-about")
    .addEventListener("click", () => openOverlay("overlay-about"));

  // OK / close buttons on overlay pages
  for (const btn of document.querySelectorAll("[data-close-overlay]")) {
    btn.addEventListener("click", () => closeOverlay(btn.dataset.closeOverlay));
  }

  // Close overlays on backdrop click
  for (const page of document.querySelectorAll(".overlay-page")) {
    page.addEventListener("click", (e) => {
      if (e.target === page) {
        const id = page.id;
        page.classList.remove("open");
        if (id === "overlay-options") closeOverlay(id);
      }
    });
  }

  // Expose badge updater so GameView can call it after renders
  gameController._updateBadge = () => updateGameBadge(gameController);
}

/**
 * Populate the Options overlay
 */
function populateOptions(gameController) {
  buildPlayerTypeSection(gameController);

  const diffContainer = document.getElementById("options-difficulty-container");
  if (diffContainer) {
    diffContainer.innerHTML = "";
    const selector = new DifficultySelector((difficulty) => {
      gameController.selectedDifficulty = difficulty;
      gameController.aiStrategy = gameController.getAIStrategy(difficulty);
      // Highlight selection
      for (const b of diffContainer.querySelectorAll(".difficulty-button")) {
        b.classList.remove("difficulty-active-selection");
      }
      const btn = diffContainer.querySelector(
        `[data-difficulty="${difficulty}"]`,
      );
      if (btn) btn.classList.add("difficulty-active-selection");
    });
    const el = selector.createElement();
    const current = gameController.selectedDifficulty || "medium";
    const btn = el.querySelector(`[data-difficulty="${current}"]`);
    if (btn)
      btn.classList.add("difficulty-selected", "difficulty-active-selection");
    diffContainer.appendChild(el);
  }

  const statsContainer = document.getElementById("options-stats-container");
  if (statsContainer) {
    statsContainer.innerHTML = "";
    statsContainer.appendChild(new StatisticsPanel().createElement());
  }
}

/**
 * Initialize the game application
 */
function initGame() {
  const appContainer = document.getElementById("app");
  if (!appContainer) {
    logger.error("App container not found");
    return;
  }

  logger.info("Initializing Escoba de Quince game");

  try {
    const eventBus = new EventBus();
    const gameView = new GameView(appContainer, eventBus);
    const gameController = new GameController(gameView, eventBus);

    // Patch updateGameBoard to also refresh the title badge
    const origUpdate = gameView.updateGameBoard.bind(gameView);
    gameView.updateGameBoard = (gs) => {
      origUpdate(gs);
      updateGameBadge(gameController);
    };

    // Also update badge after initial render
    const origRender = gameView.render.bind(gameView);
    gameView.render = (gs) => {
      origRender(gs);
      updateGameBadge(gameController);
    };

    initSidePanel(gameController);
    registerServiceWorker();

    // Start directly with medium difficulty
    gameController.startNewGame("medium");

    logger.info("Game initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize game", error);
    appContainer.innerHTML = `<p style="color: red;">Failed to initialize game: ${error.message}</p>`;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initGame);
} else {
  initGame();
}
