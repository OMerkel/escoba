/**
 * Statistics Panel Component
 * Displays player stats and game history
 */

export class StatisticsPanel {
  constructor() {
    this.stats = this.loadStats();
  }

  /**
   * Load statistics from localStorage
   */
  loadStats() {
    const stored = localStorage.getItem("escoba_stats");
    if (!stored) {
      return {
        easy: { wins: 0, losses: 0, avgScore: 0, gamesPlayed: 0 },
        medium: { wins: 0, losses: 0, avgScore: 0, gamesPlayed: 0 },
        hard: { wins: 0, losses: 0, avgScore: 0, gamesPlayed: 0 },
        challenge: { wins: 0, losses: 0, avgScore: 0, gamesPlayed: 0 },
      };
    }
    return JSON.parse(stored);
  }

  /**
   * Save statistics to localStorage
   */
  saveStats() {
    localStorage.setItem("escoba_stats", JSON.stringify(this.stats));
  }

  /**
   * Record game result
   */
  recordGame(difficulty, won, playerScore) {
    if (!this.stats[difficulty]) {
      this.stats[difficulty] = {
        wins: 0,
        losses: 0,
        avgScore: 0,
        gamesPlayed: 0,
      };
    }

    const stat = this.stats[difficulty];
    if (won) {
      stat.wins++;
    } else {
      stat.losses++;
    }

    stat.gamesPlayed++;
    stat.avgScore =
      (stat.avgScore * (stat.gamesPlayed - 1) + playerScore) / stat.gamesPlayed;

    this.saveStats();
  }

  /**
   * Get win rate for difficulty
   */
  getWinRate(difficulty) {
    const stat = this.stats[difficulty];
    if (stat.gamesPlayed === 0) return "N/A";
    const rate = ((stat.wins / stat.gamesPlayed) * 100).toFixed(1);
    return `${rate}%`;
  }

  /**
   * Create statistics UI
   */
  createElement() {
    const container = document.createElement("div");
    container.className = "statistics-panel";
    container.setAttribute("role", "region");
    container.setAttribute("aria-label", "Game Statistics");

    const heading = document.createElement("h3");
    heading.textContent = "Your Statistics";
    heading.className = "stats-heading";
    container.appendChild(heading);

    const statsGrid = document.createElement("div");
    statsGrid.className = "stats-grid";

    const difficulties = ["easy", "medium", "hard", "challenge"];
    const labels = ["Easy", "Medium", "Hard", "Challenge"];

    for (let i = 0; i < difficulties.length; i++) {
      const diff = difficulties[i];
      const label = labels[i];
      const stat = this.stats[diff];

      const card = document.createElement("div");
      card.className = `stats-card stats-${diff}`;

      card.innerHTML = `
        <h4>${label}</h4>
        <div class="stat-item">
          <span class="stat-label">Wins:</span>
          <span class="stat-value">${stat.wins}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Losses:</span>
          <span class="stat-value">${stat.losses}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Win Rate:</span>
          <span class="stat-value">${this.getWinRate(diff)}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Avg Score:</span>
          <span class="stat-value">${stat.avgScore.toFixed(1)}</span>
        </div>
      `;

      statsGrid.appendChild(card);
    }

    container.appendChild(statsGrid);

    const resetBtn = document.createElement("button");
    resetBtn.textContent = "Reset Statistics";
    resetBtn.className = "stats-reset-btn";
    resetBtn.addEventListener("click", () => this.resetStats());
    container.appendChild(resetBtn);

    return container;
  }

  /**
   * Reset all statistics
   */
  resetStats() {
    if (confirm("Reset all statistics? This cannot be undone.")) {
      this.stats = {
        easy: { wins: 0, losses: 0, avgScore: 0, gamesPlayed: 0 },
        medium: { wins: 0, losses: 0, avgScore: 0, gamesPlayed: 0 },
        hard: { wins: 0, losses: 0, avgScore: 0, gamesPlayed: 0 },
        challenge: { wins: 0, losses: 0, avgScore: 0, gamesPlayed: 0 },
      };
      this.saveStats();
      // Trigger UI update
      window.dispatchEvent(new CustomEvent("statsReset"));
    }
  }

  /**
   * Update component with new stats
   */
  updateComponent(element) {
    const newComponent = this.createElement();
    element.replaceWith(newComponent);
    return newComponent;
  }
}
