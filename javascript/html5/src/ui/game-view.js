/**
 * GameView is the main UI component
 *
 * @class GameView
 * Renders game board and handles user interactions
 * Placeholder for full implementation
 */

export class GameView {
  constructor(container, eventBus) {
    this.container = container;
    this.eventBus = eventBus;
  }

  /**
   * Render game state to DOM
   * @param {GameState} gameState
   */
  render(gameState) {
    this.container.innerHTML = `
      <div class="game-container">
        <section class="game-section">
          <h2>Table (${gameState.tableCards.length} cards)</h2>
          <p>Game Phase: ${gameState.phase}</p>
        </section>
        <section class="game-section">
          <h2>Your Hand</h2>
          <p>${gameState.currentPlayer.hand.length} cards</p>
        </section>
        <section class="game-section">
          <h2>Scores</h2>
          <p>P1: ${gameState.players[0].score}</p>
          <p>P2: ${gameState.players[1].score}</p>
        </section>
      </div>
    `;
  }
}
