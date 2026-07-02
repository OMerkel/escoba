/**
 * Difficulty Selector Component
 * Menu for selecting AI difficulty level
 */

export class DifficultySelector {
  constructor(onDifficultySelected = null) {
    this.onDifficultySelected = onDifficultySelected;
    this.difficulties = [
      {
        id: "easy",
        label: "Easy",
        description: "Risk-Averse AI - Safe and Defensive",
        color: "green",
        emoji: "🌟",
        recommended: false,
        winRate: "~33%",
      },
      {
        id: "medium",
        label: "Medium",
        description: "Balanced Greedy AI - Reliable",
        color: "blue",
        emoji: "🎯",
        recommended: true,
        winRate: "~50%",
      },
      {
        id: "hard",
        label: "Hard",
        description: "Card-Preserving AI - Aggressive Master",
        color: "red",
        emoji: "⚡",
        recommended: false,
        winRate: "~80%",
      },
      {
        id: "challenge",
        label: "Challenge",
        description: "Momentum AI - Unpredictable Adapter",
        color: "purple",
        emoji: "🔥",
        recommended: false,
        winRate: "~50-60%",
      },
    ];
  }

  /**
   * Create difficulty selector UI
   * @returns {HTMLElement}
   */
  createElement() {
    const container = document.createElement("div");
    container.className = "difficulty-selector";
    container.setAttribute("role", "region");
    container.setAttribute("aria-label", "Difficulty Selection");

    const heading = document.createElement("h2");
    heading.textContent = "Select Difficulty";
    heading.className = "difficulty-heading";
    container.appendChild(heading);

    const subtitle = document.createElement("p");
    subtitle.textContent = "Choose your opponent strength";
    subtitle.className = "difficulty-subtitle";
    container.appendChild(subtitle);

    const optionsContainer = document.createElement("div");
    optionsContainer.className = "difficulty-options";
    optionsContainer.setAttribute("role", "group");

    for (const difficulty of this.difficulties) {
      const button = this.createDifficultyButton(difficulty);
      optionsContainer.appendChild(button);
    }

    container.appendChild(optionsContainer);

    const infoBox = document.createElement("div");
    infoBox.className = "difficulty-info";
    infoBox.innerHTML = `
      <p><strong>AI Win Rate:</strong> Expected AI win rate at each difficulty level. Human win rate = 100% - AI win rate.</p>
      <p><strong>Recommended:</strong> Start with Medium for a balanced experience.</p>
    `;
    container.appendChild(infoBox);

    return container;
  }

  /**
   * Create individual difficulty button
   */
  createDifficultyButton(difficulty) {
    const button = document.createElement("button");
    button.className = `difficulty-button difficulty-${difficulty.color}`;
    button.dataset.difficulty = difficulty.id;
    button.setAttribute(
      "aria-label",
      `${difficulty.label} - ${difficulty.description}`,
    );

    if (difficulty.recommended) {
      button.classList.add("difficulty-recommended");
    }

    button.innerHTML = `
      <div class="difficulty-button-content">
        <div class="difficulty-emoji">${difficulty.emoji}</div>
        <div class="difficulty-info-box">
          <h3 class="difficulty-label">${difficulty.label}</h3>
          <p class="difficulty-description">${difficulty.description}</p>
          <p class="difficulty-winrate">AI win rate: ${difficulty.winRate}</p>
        </div>
        ${difficulty.recommended ? '<div class="difficulty-badge">Recommended</div>' : ""}
      </div>
    `;

    button.addEventListener("click", () => {
      if (this.onDifficultySelected) {
        this.onDifficultySelected(difficulty.id);
      }
    });

    return button;
  }
}
