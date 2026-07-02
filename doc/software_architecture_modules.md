# Software Architecture Modules

## Module Responsibilities

### Core Game Logic (`src/core/`)

#### `card.js` - Card Representation (FR-1.1, FR-1.2)

```javascript
// Immutable card dataclass
class Card {
  constructor(suit, rank) {
    Object.freeze(this)
  }
  getValue()      // Returns 1-10 per FR-1.2
  toString()      // "7_Oros", "Sota_Copas", etc.
  equals(other)   // Card comparison
}
```

**Responsibility**: Card value mapping, equality, string representation.

---

#### `deck.js` - Deck Management (FR-1.1, FR-2)

```javascript
class Deck {
  constructor(options)
  static createStandardDeck()        // 40-card Baraja Espanola
  shuffle()                          // Randomized shuffle
  deal(count)                        // Draw and return `count` cards
  remaining()                        // Cards left in stock
  isEmpty()                          // Stock exhausted?
}
```

**Responsibility**: Deck creation, shuffling, stock management. Maps to FR-2
(dealing).

---

#### `game-state.js` - Game State Management (FR-1.3, FR-9, FR-11)

```javascript
class GameState {
  constructor(options)

  transition(newPhase, updates)

  get currentPlayer()
  get opponent()
  get isGameOver()
  get winner()
}
```

**Responsibility**: Game state container, phase management, and immutable-style
state replacement via `transition(newPhase, updates)`. Core to FR-9 (win
condition) and FR-11 (configuration).

#### Winning Condition Algorithm (FR-9.1)

In the current implementation, the official Escoba de Quince winning rule is
implemented in `game-engine.js`, while `GameState.isGameOver` is a phase-based
getter that reports whether the state has already been moved to the terminal
phase.

```javascript
GameEngine.isGameOver() {
  const minWinScore = 21
  const minPointDifference = 2

  const player1Score = this.gameState.players[0].score
  const player2Score = this.gameState.players[1].score

  if (
    player1Score >= minWinScore &&
    player1Score - player2Score >= minPointDifference
  ) {
    return true
  }

  if (
    player2Score >= minWinScore &&
    player2Score - player1Score >= minPointDifference
  ) {
    return true
  }

  return false
}
```

Current `GameState` terminal-phase check:

```javascript
get isGameOver() {
  return this.phase === "gameEnd"
}
```

**Win Condition Examples:**

- `21` to `19`: target reached and two-point lead, so **P1 Wins**.
- `21` to `20`: target reached but one-point lead, so play continues.
- `21` to `21`: target reached but tied, so play continues.
- `22` to `20`: target reached and two-point lead, so **P1 Wins**.
- `25` to `24`: target reached but one-point lead, so play continues.
- `20` to `21`: target reached by P2 but without a two-point lead, so play
  continues until the lead condition is satisfied.

---

#### `turn.js` - Turn Structure (FR-3)

```javascript
class Turn {
  constructor(gameState, playerId)

  playCard(card, tableCardsToCapture)
  canCapture(card)
  getAvailableCaptures(card)
  getAvailableDiscards()
}
```

**Responsibility**: Turn validation, available move enumeration, play execution.
Maps to FR-3 (turn structure).

---

#### `capture.js` - Capture Mechanics (FR-4, FR-5)

```javascript
class CaptureEngine {
  static isValidCapture(playedCard, tableCards)
  static findAllCaptures(playedCard, tableCards)
  static enforcePreference(captures)

  executeCapture(gameState, playerId, card, tableCards)
}
```

**Responsibility**: Capture validation, sum checking, preference rules.
Implements FR-4 (capture mechanics) and FR-4.4 (single-complement priority).

---

#### `escoba.js` - Escoba Detection (FR-6, FR-10)

```javascript
class EscobaEngine {
  static isEscoba(tableBeforeCapture, tableAfterCapture)
  static countEscobas(gameState, playerId)
  static awardFinalTableCards(gameState, lastCapturerId)
  static checkInitialTableSpecial(table)
}
```

**Responsibility**: Escoba detection, point attribution, special cases.
Implements FR-6 (escoba), FR-6.3 (no escoba on final award), FR-10 (special
cases).

---

#### `scoring.js` - Scoring Categories (FR-8)

```javascript
class ScoringEngine {
  static scoreRound(gameState)
  static scoreCards(p1Pile, p2Pile)
  static scoreOros(p1Pile, p2Pile)
  static scoreSevenOros(p1Pile, p2Pile)
  static scoreSetenta(p1Pile, p2Pile, method)
  static countEscobas(p1Pile, p2Pile)

  static scoreSetentaPrime(pile)
  static scoreSetentaSimplified(pile)
  static scoreSetentaNumerical(pile)
}
```

**Responsibility**: All scoring category logic. Maps to FR-8 (scoring), with
support for the active setenta methods.

---

#### `dealing.js` - Deal Mechanics (FR-2, FR-7)

```javascript
class DealingEngine {
  static dealInitial(gameState)
  static dealRedeal(gameState)
  static isStockExhausted(gameState)
  static rotateDealerNextRound(gameState)
}
```

**Responsibility**: Deal sequence, stock management, dealer rotation. Maps to
FR-2 (dealing) and FR-7 (round end).

---

#### `round-end.js` - Round-End Helpers (FR-7, FR-8)

```javascript
awardFinalCards(tableCards, lastCapturer)
isRoundComplete(gameState)
executeRoundEnd(config)
detectTie(p1Result, p2Result)
```

**Responsibility**: Dedicated round-end helper module for awarding remaining
table cards, checking round completion conditions, transitioning to scoring
phase, and tie-result helper logic. This exists alongside engine-level round
orchestration and is covered by `test-round-end.test.js`.

---

#### `rules.js` - Rule Enforcement (FR-4.3, FR-10)

```javascript
class RuleEngine {
  static canDeferCapture(gameState, playerId, card)
  static applyInitialTableRules(gameState)
}
```

**Responsibility**: Enforces mandatory capture rule and special initial
conditions. Maps to FR-4.3 and FR-10.

---

#### `game-engine.js` - Game Orchestration

```javascript
class GameEngine {
  constructor(config)
  startGame()
  executeMove(playerId, card, captureSet)
  playTurn(playerIndex, move)
  playAITurn(playerIndex)
  processRoundEnd()
  isGameOver()
}
```

**Responsibility**: Coordinates dealing, moves, round transitions, scoring, and
turn routing across human and AI players.

---

### AI Engines (`src/ai/`)

#### `ai-manager.js` - AI Orchestration (FR-12, FR-13, FR-15)

```javascript
selectStrategy(config)
executeAIMove(strategy, hand, tableCards, gameState, config)
validateAIMove(move, hand, tableCards)
getAIMove(playerConfig, hand, tableCards, gameState)

class AIManager {
  constructor(strategy, config)
  generateMove(gameState)
  selectStrategy(strategyName)
}
```

**Responsibility**: AI player management, strategy dispatch, async execution.
Implements FR-12 (AI player), FR-13 (game modes), FR-15 (strategy selection).

**Current implementation note**: the public AI manager module currently routes
runtime move selection through `getAIMove(...)`, and `selectStrategy(config)`
currently resolves only the greedy path directly. Negamax and MCTS exist as
separate strategy modules and are exercised in tests and tournament tooling, but
they are not yet fully wired into the main AI manager selection path.

---

#### `ai-strategy.js` and `ai-baseline.js`

These modules define strategy contracts and baseline AI behavior used as the
foundation for richer strategy selection.

**Responsibility**: Provide shared strategy shape and baseline move selection.

---

#### `greedy-variants.js` - Greedy Heuristic (FR-15.1a)

```javascript
class GreedyStrategy {
  constructor(config)

  computeMove(gameState, playerId)
  static evaluateCapture(capture, gameState, playerId)
}
```

**Responsibility**: Fast rule-based AI. Default strategy family. Implements
FR-15.1a.

---

#### `negamax.js` - Negamax Alpha-Beta (FR-15.1b, FR-17.2)

```javascript
class NegamaxStrategy {
  constructor(config)

  computeMove(gameState, playerId, timeoutMs)
  static iterativeDeepenSearch(gameState, playerId, timeoutMs)
  static negamax(gameState, depth, alpha, beta, playerId, timeoutMs)
  static evaluatePosition(gameState, playerId)
}
```

**Responsibility**: Strong AI using iterative deepening within response timeout.
Implements FR-15.1b and FR-17.2.

---

#### `mcts.js` - Monte Carlo Tree Search (FR-15.1c, FR-17.1)

```javascript
class MCTSStrategy {
  constructor(config)

  computeMove(gameState, playerId, timeoutMs)
  static selection(node, c)
  static expansion(node, gameState)
  static simulation(gameState)
  static backpropagation(node, result)
  static getRolloutCount()
}
```

**Responsibility**: Advanced probabilistic AI with configurable rollout count.
Implements FR-15.1c and FR-17.1.

---

#### `evaluation-heuristics.js` - Strategic Position Evaluation

```javascript
scoreHandFlexibility(hand, tableCards)
scoreHandCommitment(hand, tableCards)
scoreSequentialCaptures(move, hand, table)
isEndgame(gameState)
evaluateEndgamePosition(pos, move, state)
scoreForcing(move, opponentMoves)
evaluatePositionStrategic(...)
estimateMoveQuality(move, hand, table)
```

**Responsibility**: Advanced strategic evaluation extending Negamax decision
quality.

**Implementation Status**:

- Phase 1: Hand composition and capture-sequence heuristics are implemented.
- Phase 2: Endgame detection remains ready for further extension.
- Phase 3: Forcing-move logic remains available for future work.
- Phase 4: Learned MCTS evaluation remains planned.

---

#### `phase2-endgame.js` and `phase2-enhanced-strategies.js`

**Responsibility**: Hold staged or experimental AI logic outside the stable
baseline path.

---

### Persistence (`src/persistence/`)

#### `persistence-manager.js` - SGF and Statistics Tracking

```javascript
parseSGF(sgfString)
exportToSGF(gameData)
class PlayerStats { ... }
class StatisticsManager { ... }
```

**Responsibility**: The current implementation consolidates the original
`sgf-parser.js`, `sgf-exporter.js`, and `stats-manager.js` architectural roles
into one persistence module. It handles SGF import/export, player statistics,
and session history.

---

### UI Components (`src/ui/` and `src/ui/components/`)

#### `index.js` - Application Shell and Overlay Routing

**Responsibility**: Bootstraps the game and owns shell-level UI orchestration
that sits above the game board, including:

- side panel open/close flow;
- overlay page routing (`rules`, `options`, `about`);
- options snapshot/apply behavior on close;
- per-seat player type toggles (`human`/`ai`) and game restart on changes;
- top badge updates for turn and score summary.

This shell behavior complements `GameController` and `GameView` rather than
replacing them.

---

#### `game-view.js` and `game-view-enhanced.js` - Main Game Board

```javascript
class GameView {
  constructor(container, gameState, eventBus)
  render(gameState)
  showTable(cards)
  showHand(cards, playerId)
  showCapturePile(cards, playerId)
  showStatus(message)
  onCardSelected(card)
  onCaptureSetSelected(tableCards)
}
```

**Responsibility**: Main game board rendering and user input handling.

---

#### `components/game-board.js` - Board Rendering, Capture Display, Hand Visibility

```javascript
class GameBoard {
  createCaptureDisplayOverlay()
  createCardDisplay(card, highlighted)
  createHandArea(playerIdx, position)
}
```

**Responsibility**: Render the central play area, show capture previews, and
apply context-aware hand visibility rules across human and AI players.

---

#### `game-ui.js` and `game-controller.js` - UI Flow and Input Routing

**Responsibility**: Coordinate high-level interface behavior, player intent, and
integration with the engine.

---

#### `components/difficulty-selector.js`

**Responsibility**: Surface AI difficulty and timing controls in the current UI
structure.

---

#### `components/statistics-panel.js`

**Responsibility**: Display and persist statistics in the current
component-based UI layer. The component stores aggregate per-difficulty
statistics in browser `localStorage` under `escoba_stats`.

---

### Utilities and Configuration (`src/utils/`, `src/config/`)

#### `constants.js`

```javascript
export const SUITS = ["Oros", "Copas", "Espadas", "Bastos"]
export const TARGET_SCORES = [11, 15, 21, 30]
export const AI_STRATEGIES = ["greedy", "negamax", "mcts"]
```

#### `configuration.js`

```javascript
export const DEFAULT_CONFIG = {
  targetScore: 21,
  setentaMethod: "numerical",
  enableFinalCardEscoba: true,
  aiStrategy: "greedy",
  aiResponseTime: 5000,
  mctsRolloutsPerDecision: 1000
}
```

In addition to defaults, the current module implements:

- schema-based validation (`validateConfiguration`) for supported keys/ranges;
- named presets (`getConfigurationPreset`) for `standard`, `quick`, and
  `tournament` profiles;
- strict preset validation via `createConfiguration(...)`.

#### `messages.js`

**Responsibility**: Centralized message templates and user-facing status text.

---

### Test Suite (`src/test/`)

The current project contains 26 active `*.test.js` modules corresponding to core
rules, AI behavior, persistence, UI integration, tournament flows, and
configuration/message integrity.

Examples include:

1. `test-card.test.js`
2. `test-deck.test.js`
3. `test-dealing.test.js`
4. `test-turn.test.js`
5. `test-captures.test.js`
6. `test-escoba.test.js`
7. `test-round-end.test.js`
8. `test-scoring.test.js`
9. `test-game-state.test.js`
10. `test-ai-manager.test.js`
11. `test-ai-strategy.test.js`
12. `test-negamax.test.js`
13. `test-mcts.test.js`
14. `test-persistence.test.js`
15. `test-game-engine.test.js`
16. `test-ui-integration.test.js`
17. `test-ui-regression.test.js`
18. `test-ui-card-removal.test.js`
19. `test-move-resolution.test.js`
20. `test-evaluation-heuristics.test.js`
21. `test-sota-cards.test.js`
22. `test-tournament.test.js`
23. `test-config-constants.test.js`
24. `test-configuration.test.js`
25. `test-messages.test.js`
26. `test-rules.test.js`

**Coverage Target**: at least 80 percent line and branch coverage in the current
Vitest configuration.
