# Escoba de Quince - Implementation Requirements

## Document Purpose

This document defines testable functional and non-functional requirements for a
digital implementation of Escoba de Quince, a two-player Spanish card game.
Requirements are organized by system component and priority.

---

## FUNCTIONAL REQUIREMENTS

### FR-1: Game State Management

#### FR-1.1 Deck Composition

- **Requirement:** The game must use exactly 40 cards organized into 4 suits
  (Oros, Copas, Espadas, Bastos).
- **Details:** Each suit contains 10 ranks: As, 2, 3, 4, 5, 6, 7, Sota, Caballo,
  Rey.
- **Testable:** Unit test verifies deck contains exactly 40 unique cards with
  correct suit/rank combinations.

#### FR-1.2 Card Value Mapping

- **Requirement:** Each card must have a gameplay value for making combinations:
  - As = 1, 2–7 = face value, Sota = 8, Caballo = 9, Rey = 10.
- **Testable:** Unit test maps each card to correct value; test total should
  equal 15 or 30 for specific combinations.

#### FR-1.3 Game State Initialization

- **Requirement:** A new game state must initialize with dealer selection,
  shuffled deck, and empty table.
- **Details:** No cards are dealt until initialization completes.
- **Testable:** Unit test verifies initial state has valid dealer, shuffled deck
  (randomness verified by distribution

test), and empty table.

---

### FR-2: Dealing

#### FR-2.1 Initial Deal

- **Requirement:** At the start of each round, deal exactly 3 cards face-down to
  each player, then 4 cards face-up to

the table.

- **Details:** Cards dealt one at a time to non-dealer first, then dealer,
  alternating.
- **Testable:** Unit test verifies each player receives 3 cards, table has 4
  cards, all dealt cards are unique.

#### FR-2.2 Re-Deal Within Round

- **Requirement:** After both players play their 3 cards, dealer must deal 3 new
  cards to each player.
- **Details:** No new table cards are added during re-deals.
- **Testable:** Unit test verifies re-deal happens exactly when both players
  have 0 cards in hand; verify new cards

dealt, old hand cards gone, table unchanged.

#### FR-2.3 Stock Exhaustion

- **Requirement:** Dealing must stop when the stock (undealt cards) is
  exhausted.
- **Details:** With 40-card deck: 6 + 4 + 30 remaining; then 5 more 3-card deals
  per player = exactly 40 cards used.
- **Testable:** Unit test verifies after 6 dealing phases, all 40 cards
  distributed and stock empty.

#### FR-2.4 Dealer Rotation

- **Requirement:** After each round, the dealer role passes to the other player.
- **Details:** Dealer consistency within a single round; rotation between
  rounds.
- **Testable:** Unit test simulates multiple rounds and verifies dealer
  alternates correctly.

---

### FR-3: Turn Structure and Play Order

#### FR-3.1 Play Order Initialization

- **Requirement:** The non-dealer plays first in every round.
- **Testable:** Unit test verifies non-dealer is assigned first action.

#### FR-3.2 Alternating Turns

- **Requirement:** Players alternate turns; each turn consists of playing
  exactly 1 card.
- **Details:** Turn must not pass until current player plays a card.
- **Testable:** Unit test alternates turns and verifies each player plays only
  when expected; verify exactly 1 card per

turn.

#### FR-3.3 Hand Depletion

- **Requirement:** Once both players have played all cards in their current
  hand, a re-deal occurs before play resumes.
- **Testable:** Unit test plays 3 cards per player (6 total), verifies re-deal
  triggered, then next player in sequence

plays.

---

### FR-4: Capture Mechanics

#### FR-4.1 Capture Validation

- **Requirement:** A capture is legal if and only if: (played card value) + (sum
  of selected table cards) = exactly 15.
- **Details:**
  - Single card capture: played card + one table card = 15.
  - Multi-card capture: played card + multiple table cards = 15.
  - No capture possible if no valid combination exists.
- **Testable:** Unit test with various table states; verify valid captures
  succeed, invalid ones rejected.

#### FR-4.2 One Capture Set Per Turn

- **Requirement:** A played card may capture exactly one set of table cards per
  turn.
- **Details:** Player may not combine multiple separate groups unless they sum
  to 15 as a single set with the played

card.

- **Testable:** Unit test with ambiguous table (multiple valid 15-sums
  possible); verify only one set selected and

removed.

#### FR-4.3 Forced Capture Rule

- **Requirement:** If a legal capture is possible, the player must capture
  (capture is mandatory).
- **Details:** Player may choose which card to play, but once played, if a
  capture is available, it must be taken.
- **Testable:** Unit test verifies rejection of plays that avoid forced
  captures; verify capture occurs automatically if

possible.

#### FR-4.4 Capture Preference Rule (Single Complement Priority)

- **Requirement:** If multiple captures are available, a single-card complement
  (played card + one table card = 15) must

be taken over multi-card combinations.

- **Details:** If table has [10, 6, 4, As] and player plays 5, must take
  10+5=15, not 6+4+5=15.
- **Testable:** Unit test with table containing both single and multi-card
  options; verify single option forced.

#### FR-4.5 Captured Cards Placement

- **Requirement:** Captured cards (both played card and table cards) move to the
  capturing player's pile, face-down.
- **Details:** Escobas marked by turning one card face-up or sideways for
  counting.
- **Testable:** Unit test verifies captured cards removed from table and added
  to player pile; pile count increments

correctly.

---

### FR-5: Non-Capture Play

#### FR-5.1 Card Remains On Table

- **Requirement:** If a played card cannot form a capture (no table cards +
  played card = 15), the played card stays on

the table face-up.

- **Details:** This increases table cards for future plays and affects
  subsequent captures.
- **Testable:** Unit test plays card with no valid capture; verify card added to
  table, player hand decremented.

---

### FR-6: Escoba (Sweep) Mechanics

#### FR-6.1 Escoba Detection

- **Requirement:** An escoba occurs when a capture removes all cards from the
  table (table becomes empty after capture).
- **Details:** Escoba must occur during regular play (not final round award).
- **Testable:** Unit test plays card that clears table; verify escoba flag set,
  point awarded.

#### FR-6.2 Escoba Count

- **Requirement:** Each escoba is worth 1 point; player tracks escobas
  throughout round.
- **Testable:** Unit test simulates multiple escobas; verify count increments
  and points awarded at scoring.

#### FR-6.3 No Escoba for Automatic Final Award

- **Requirement:** Cards awarded to the last capturer at round end do NOT count
  as an escoba, even if they empty the

table.

- **Details:** Only captures made during play count; automatic final award is
  never an escoba.
- **Testable:** Unit test plays last card to clear table; verify no escoba point
  awarded; test distinguishes between

play-phase capture and end-of-round award.

#### FR-6.4 Optional: No Escoba on Final Hand Card

- **Requirement:** (House rule, default off) A capture made with a player's
  final card of the round does not count as an

escoba, even if it clears the table.

- **Details:** Escobas only count if made while player has additional cards in
  hand.
- **Testable:** Unit test with flag for this rule; verify escoba rejected when
  capture is with final card; verify escoba

allowed when cards remain in hand.

---

### FR-7: End of Round Mechanics

#### FR-7.1 Round Completion Detection

- **Requirement:** Round ends when stock is exhausted and both players have
  played their final 3-card hand.
- **Testable:** Unit test verifies round-end condition triggered after exactly
  40 cards played.

#### FR-7.2 Final Table Card Award

- **Requirement:** Any cards remaining on table at round end are awarded to the
  player who made the last capture during

the round.

- **Details:**
  - If no capture was ever made (edge case), table cards remain unclaimed.
  - Award is NOT an escoba.
- **Testable:** Unit test simulates round with cards left on table; verify last
  capturer receives them; verify no escoba

point.

#### FR-7.3 Leftover Table Distribution

- **Requirement:** Award must occur even if table is empty (but this is rare if
  last capture emptied it).
- **Testable:** Unit test with empty table at round end; verify no award needed
  if table already empty.

---

### FR-8: Scoring Categories

#### FR-8.1 Cards Category

- **Requirement:** Player with more than 20 captured cards scores 1 point. At
  exactly 20–20 tie, no one scores.
- **Testable:** Unit test with various capture counts; verify point awarded
  correctly.

#### FR-8.2 Oros Category

- **Requirement:** Player with more Oros (Gold suit) cards scores 1 point. At
  5–5 tie, no one scores.
- **Testable:** Unit test counts Oros per player; verify point awarded to
  majority holder or tie detected.

#### FR-8.3 7 of Oros Category

- **Requirement:** Player who captured the 7 of Oros scores 1 point.
- **Details:** Only one player can have it; no tie possible.
- **Testable:** Unit test verifies point awarded to player with this specific
  card.

#### FR-8.4 Setenta/Prime Category (Multiple Methods)

##### FR-8.4a: Prime-Style Ranking (Recommended)

- **Requirement:** Each player selects their best card per suit: 7 > 6 > As > 5
  > 4 > 3 > 2 > picture cards.
- **Details:** Lexicographically compare: player with higher best card wins; if
  tied, compare next card, etc.
- **Testable:** Unit test with various captured card combinations; verify best
  4-card set selected and compared

correctly.

##### FR-8.4b: Simplified Setenta (Optional)

- **Requirement:** Player with more 7s in captured cards scores 1 point.
- **Testable:** Unit test counts 7s per player; verify point awarded to majority
  or tie.

##### FR-8.4c: Numerical Setenta (Optional)

- **Requirement:** Player's best card per suit is valued: 7=21, 6=18, As=16,
  5=15, 4=14, 3=13, 2=12, picture=10.
- **Details:** Sum the 4 values; higher total wins.
- **Testable:** Unit test computes values and totals; verify higher sum wins
  category.

#### FR-8.5 Escoba Points

- **Requirement:** Each escoba made during play awards 1 point.
- **Testable:** Unit test counts escobas; verify points match escoba count.

#### FR-8.6 Round Scoring Summary

- **Requirement:** At round end, aggregate all category points + escoba points
  for each player.
- **Details:** Standard round max: 4 category + N escobas.
- **Testable:** Unit test simulates complete round; verify final scores
  calculated correctly.

---

### FR-9: Game Win Condition

#### FR-9.1 Target Score Achievement (Escoba de Quince Rules)

- **Requirement:** Game ends when one player reaches the target score AND
  maintains a minimum lead (default: 21 points with 2-point lead).
- **Details:**
  - Player must reach ≥21 points AND lead by ≥2 points (e.g., 21-19, 22-20).
  - Tied scores at or above target require continued play: 21-21, 22-22, etc. do
    not end the game.
  - Only when one player has both ≥21 points AND a 2+ point advantage does the
    game end.
  - Example: Player A=21, Player B=20 → game continues (only 1-point lead).
    Player A=21, Player B=19 → Player A wins (2-point lead).
  - Configurable to other targets (11, 15, 30) with same 2-point lead
    requirement.
- **Testable:** Unit test runs multiple rounds with various scores (including
  ties at threshold); verify win condition only triggers with 21+ points AND 2+
  point difference.

#### FR-9.2 Running Score Tracking

- **Requirement:** Game maintains cumulative scores across all rounds.
- **Testable:** Unit test verifies running total after each round and over
  multiple rounds.

---

### FR-10: Special Cases

#### FR-10.1 Initial Table Totals 15

- **Requirement:** If the 4 initial face-up table cards total exactly 15, dealer
  immediately captures them; counts as 1

escoba.

- **Testable:** Unit test with initial table [7, 6, As, As]; verify dealer gets
  cards and 1 escoba point.

#### FR-10.2 Initial Table Totals 30

- **Requirement:** If the 4 initial table cards total exactly 30, dealer
  captures them; counts as 2 escobas.
- **Testable:** Unit test with initial table [10, 10, 10, 0] or equivalent;
  verify 2 escoba points.

#### FR-10.3 No Captures Made (Edge Case)

- **Requirement:** If no captures occur during entire round, leftover table
  cards remain unclaimed and are not awarded.
- **Details:** This is extremely rare in practice.
- **Testable:** Unit test with discard-only scenario; verify no cards awarded at
  end.

---

### FR-11: Configuration and Options

#### FR-11.1 Target Score Configuration

- **Requirement:** Target score must be configurable (default 21, commonly 11,
  15, 30).
- **Testable:** Unit test with different target values; verify win condition
  applies to each.

#### FR-11.2 Setenta Method Selection

- **Requirement:** Players/implementation must support selection of which
  setenta method is used.
- **Testable:** Unit test with each method active; verify correct scoring for
  each.

#### FR-11.3 House Rule: Final Card No Escoba

- **Requirement:** Optional rule disabling escobas on final hand cards must be
  configurable (default off).
- **Testable:** Unit test with flag enabled/disabled; verify escoba behavior
  changes.

---

### FR-12: AI Player

#### FR-12.1 AI Player Support

- **Requirement:** The game must support at least one AI-controlled player in
  addition to human players.
- **Details:** AI follows same rules as human players; all moves must be legal
  per FR-4–FR-7.
- **Testable:** Unit test creates game with AI player, verifies AI moves are
  valid captures or legal discards.

#### FR-12.2 Asynchronous AI Execution

- **Requirement:** AI player moves must be computed asynchronously to prevent
  blocking the game UI/HMI.
- **Details:** AI move calculation happens on background thread/task; main game
  loop remains responsive.
- **Testable:** Unit test spawns AI move, verifies main thread not blocked; move
  completes within configured timeout.

#### FR-12.3 AI Response Time Configuration

- **Requirement:** AI response time must be configurable by user via Options
  Menu, with range 1–10 seconds.
- **Details:**
  - 1 second: fastest (AI difficulty = hard, minimal thinking time).
  - 10 seconds: slowest (AI difficulty = easy, maximum thinking time for
    strategy).
  - Response time acts as difficulty level: shorter = more difficult opponent.
- **Testable:** Unit test sets response time to various values (1, 5, 10);
  verify AI completes move within ±200ms of

configured time; verify time parameter correctly passed to AI.

#### FR-12.4 AI Move Selection Strategy

- **Requirement:** AI must implement a legal move strategy (heuristic-based or
  minimax-based; implementation detail).
- **Details:** Strategy must prefer high-value captures (Escobas, 7 of Oros)
  over neutral moves; must not violate

forced-capture rule (FR-4.3).

- **Testable:** Unit test with predefined board states; verify AI selects
  optimal or near-optimal moves; verify escobas

are prioritized.

---

### FR-13: Game Mode Selection

#### FR-13.1 Player Type Configuration

- **Requirement:** Game must support four player mode combinations, selectable
  before game start:
  1. Human vs. Human
  2. Human vs. AI
  3. AI vs. Human
  4. AI vs. AI
- **Details:** Configuration persists for entire game session unless changed in
  Options Menu.
- **Testable:** Unit test verifies each mode can be selected and game starts
  with correct player types.

#### FR-13.2 AI Difficulty Selection

- **Requirement:** When any AI player is selected, user must be able to
  configure AI response time (1–10 seconds) in

Options Menu.

- **Details:** Default = 5 seconds. Applies to all AI players in the game.
- **Testable:** Unit test verifies Options Menu allows time range selection;
  game applies selected time to all AI

players.

#### FR-13.3 Turn Handling by Player Type

- **Requirement:** Game must route turns to human input handler or AI engine
  based on current player type.
- **Details:**
  - Human turn: game waits for user input (move submission).
  - AI turn: game triggers async AI move computation; UI shows "AI is
    thinking..." or similar.
- **Testable:** Unit test alternates human/AI turns; verify human turn blocks on
  input, AI turn proceeds asynchronously.

---

### FR-14: Statistics Tracking

#### FR-14.1 Per-Player Score History

- **Requirement:** Game must track cumulative score for each player across all
  rounds in a session.
- **Details:** Running total displayed after each round scoring.
- **Testable:** Unit test simulates multiple rounds; verify score increments
  correctly after each round.

#### FR-14.2 Escoba Count Per Player

- **Requirement:** Game must track total escobas made by each player throughout
  the session.
- **Testable:** Unit test simulates rounds with escobas; verify total count
  increments.

#### FR-14.3 Win Rate Calculation

- **Requirement:** Game must calculate and display win rate as: (rounds won) /
  (total rounds played) as a percentage.
- **Details:**
  - Updated after each completed game (when a player reaches target score).
  - Tracks cumulative across multiple games in same session.
- **Testable:** Unit test plays multiple games with known outcomes; verify win
  rate = correct percentage.

#### FR-14.4 Average Escobas Per Round

- **Requirement:** Game must calculate average escobas per round for each
  player: (total escobas) / (total rounds

played).

- **Testable:** Unit test with known escoba counts and round counts; verify
  average calculated correctly.

#### FR-14.5 Statistics Display

- **Requirement:** Statistics must be displayable after game completion or in a
  dedicated Statistics view.
- **Details:** Minimum display fields: Player name, Total Score, Rounds Played,
  Escobas Total, Win Rate (%), Avg

Escobas/Round.

- **Testable:** Unit test verifies all statistics retrievable; display format
  consistent.

#### FR-14.6 Statistics Persistence Within Session

- **Requirement:** Statistics must persist for the duration of the session (game
  remains running).
- **Details:** Statistics are not saved to disk (per FR-3 decision); they reset
  when application closes.
- **Testable:** Unit test plays multiple games back-to-back; verify cumulative
  statistics tracked; verify reset after

application restart simulation.

---

### FR-15: AI Strategy Selection

#### FR-15.1 AI Strategy Configuration

- **Requirement:** Game must support three AI strategy algorithms, selectable
  via Options Menu:
  1. **Greedy Heuristic:** Fast, rule-based evaluation; prioritizes immediate
     high-value moves (Escobas, 7 of Oros).
  2. **Negamax with Alpha-Beta Pruning:** Medium complexity; evaluates future
     game states with pruning for performance.
  3. **MCTS (Monte Carlo Tree Search) with UCT/UCB:** Advanced; probabilistic
     tree search for strategic lookahead.
- **Details:** Default strategy = Greedy Heuristic. User selectable before or
  during game.
- **Testable:** Unit test verifies each strategy can be selected; verify game
  runs with each active; verify

strategy-specific move selection.

#### FR-15.2 Strategy-Specific Behavior

- **Requirement:** Each strategy must produce legally valid moves but with
  different decision quality.
- **Details:**
  - Greedy: Fast decisions, may miss long-term strategy.
  - Negamax: Balanced; considers upcoming turns.
  - MCTS: Slower but potentially stronger play.
- **Testable:** Unit test with identical board state; run all three strategies;
  verify different moves selected for same

situation; verify all moves legal.

#### FR-15.3 Response Time Integration

- **Requirement:** AI response time setting (FR-12.3) applies across all
  strategies; strategies complete within

configured timeout.

- **Details:** Greedy always completes quickly; Negamax/MCTS use time allocation
  to deepen search.
- **Testable:** Unit test runs each strategy with various response times (1, 5,
  10 sec); verify completion within

timeout; verify deeper search with longer time.

---

### FR-16: Game File Format Support (SGF)

#### FR-16.1 SGF Game Situation Setup

- **Requirement:** Game situations for unit testing must be definable in Smart
  Game Format (SGF) files.
- **Details:**
  - SGF file specifies: player hands, table cards, player capture piles, current
    turn, score state, round number.
  - Test fixtures parse SGF to initialize game state for testing.
  - Format: Subset of SGF standard adapted for Escoba (card games variant).
- **Testable:** Unit test loads SGF file, verifies game state matches
  specification; compare parsed state to expected

values.

#### FR-16.2 SGF Move History Export

- **Requirement:** Game moves must be logged in SGF format for debugging,
  analysis, and replay.
- **Details:**
  - Move history exports to `.sgf` file after game completion or on demand.
  - SGF captures: each move (card played, cards captured, escoba if applicable),
    scores after each round.
  - Human-readable; allows external analysis and reproducibility.
- **Testable:** Unit test plays known game sequence, exports SGF, re-parses SGF,
  verifies move sequence matches; test

round-trip consistency.

---

### FR-17: Configuration Management

#### FR-17.1 MCTS Rollout Configuration

- **Requirement:** MCTS rollout count must be configurable via configuration
  module (not hardcoded).
- **Details:**
  - Configuration source: JavaScript configuration module(s) under
    `javascript/html5/src/config` (see FR-17.3).
  - Parameter: `mctsRolloutsPerDecision` (integer, typical range 100-10000).
  - Higher values = more computation but stronger play within response time
    window.
- **Testable:** Unit test reads configuration values, verifies rollout count
  applied to MCTS;
  test with different values; verify

rollout count matches configuration.

#### FR-17.2 Negamax Iterative Deepening

- **Requirement:** Negamax must use iterative deepening strategy to adapt search
  depth to response time timeout.
- **Details:**
  - Algorithm: Start search at depth 1, progressively increase depth (1, 2, 3,
    ...) until response timeout approaches.
  - Final complete search result at deepest depth reached within timeout is
    used.
  - Allows adaptive play quality: shorter timeout = shallower search, longer
    timeout = deeper search.
- **Testable:** Unit test runs Negamax with various response times (1, 5, 10
  sec); verify depths increase with time;

verify search completes within timeout; verify move quality improves with deeper
search.

#### FR-17.3 Configuration Source Format (Module-Based)

- **Requirement:** Game configuration and AI parameters must be defined in
  source configuration modules.
- **Details:**
  - Primary location: `javascript/html5/src/config/configuration.js`
  - Contains: AI strategy settings, response time, MCTS rollout count, target
    score defaults, and related options.
  - Runtime validation: configuration values are validated by config utilities.
- **Testable:** Unit test creates valid/invalid configuration objects; verify
  valid configs load correctly; verify invalid

configs rejected with clear error message.

---

### FR-UI-1: Capture Display Visualization

#### FR-UI-1.1 Mandatory Capture Set Display

- **Requirement:** After a player selects a capture set (or makes a discard),
  the capture set must be displayed visually

for exactly 4 seconds before the move is executed.

- **Details:**
  - Applies to both human and AI players without distinction.
  - Display shows: played card + captured table cards (if any), with their
    values and sum.
  - If no capture (discard), display shows the played card and "no capture
    possible" message.
  - During display, game input is disabled (non-interactive state).
- **Testable:** Unit test triggers capture/discard, verifies game state
  transitions to `captureDisplay` phase, displays

for 4 seconds, then transitions back to `playing` and executes move; test
verifies move does not execute until display timeout.

#### FR-UI-1.2 Highlight and Emphasis

- **Requirement:** Played card and captured table cards must be visually
  highlighted/emphasized during display.
- **Details:**
  - Highlighting uses CSS styling (e.g., green border, shadow, scale transform).
  - Same visual treatment as user selection frame (raised/enlarged appearance).
  - Card values and sum calculation (e.g., "5 + 10 = 15") displayed alongside.
- **Testable:** Visual inspection during test execution; verify overlay appears
  centered with readable text and card

values.

#### FR-UI-1.3 Display Duration Configuration

- **Requirement:** Capture display duration must be configurable via
  source configuration.
- **Details:**
  - Configuration parameter: `captureDisplayDuration` (milliseconds).
  - Default: 4000ms.
  - Range: 1000–10000ms (recommended 2000–6000ms for playability).
- **Testable:** Unit test reads configuration values, verifies duration applied;
  test with
  different values; verify display timing

matches configuration.

#### FR-UI-1.4 Player Label Display

- **Requirement:** The capture display overlay must show whose move is being
  displayed (e.g., "Human South's Move" or

"AI North's Move").

- **Details:**
  - Label helps distinguish between players, especially important in AI vs AI
    games.
  - Uses player type and position for clarity.
- **Testable:** Verify player label appears correctly in overlay; test for both
  human and AI players.

---

### FR-UI-2: Hand Card Visibility

#### FR-UI-2.1 Hand Card Display

- **Requirement:** All player hand cards must be displayed visually (never
  completely hidden from the UI).
- **Details:**
  - Cards are displayed either face-up (visible rank/suit) or face-down (card
    back) depending on game mode and turn.
  - Card count badge always visible regardless of display style.
- **Testable:** Visual inspection during all game modes; verify hand area shows
  cards or card backs, never empty.

#### FR-UI-2.2 Mixed Game Mode Visibility

- **Requirement:** In mixed game modes (Human vs AI or AI vs Human):
  - AI player hand: always displayed as card backs (face-down, hidden).
  - Human player hand: face-up and clickable when active, face-down when
    non-active.
- **Details:**
  - AI cards remain hidden to prevent strategy visibility.
  - Human player's cards are hidden when not their turn to protect privacy.
- **Testable:** Unit test in mixed mode verifies AI cards always face-down;
  human cards face-up during turn, face-down

otherwise.

#### FR-UI-2.3 Same-Type Game Mode Visibility

- **Requirement:** In same-type game modes (AI vs AI or Human vs Human):
  - Active player hand: face-up and fully visible.
  - Non-active player hand: displayed as card backs (face-down, hidden).
- **Details:**
  - Applies equally to both players regardless of type.
  - Both players' strategies are partially obscured (opponent's hand hidden).
- **Testable:** Unit test in same-type mode verifies active player cards
  face-up, non-active player cards face-down;

switch turns and verify swap.

#### FR-UI-2.4 Hand Card Interaction

- **Requirement:** Only face-up cards are clickable for selection; face-down
  cards are non-interactive.
- **Details:**
  - Prevents invalid moves (selecting opponent's hidden cards).
  - Visual feedback (cursor, hover state) indicates clickability.
- **Testable:** Unit test verifies click events only trigger on face-up cards;
  face-down cards emit no selection events.

---

## NON-FUNCTIONAL REQUIREMENTS

### NFR-1: Performance

#### NFR-1.1 Turn Latency

- **Requirement:** A single turn (play card → capture resolution → state update)
  completes within 100ms on typical

hardware.

- **Testable (Future):** Performance benchmark with warm-up; measure turn time.

#### NFR-1.2 Round Completion Time

- **Requirement:** A complete round (40 cards, ~12 captures) completes within 5
  seconds in single-threaded execution.
- **Testable (Future):** Benchmark full round with standard play.

### NFR-2: Code Quality

#### NFR-2.1 Test Coverage

- **Requirement:** Functional requirements coverage ≥ 90% (by line and branch).
- **Testable:** Coverage report from test suite.

#### NFR-2.2 Linting and Type Safety

- **Requirement:** Code passes Biome linting/formatting checks and JavaScript
  test validations.
- **Testable:** Linting tool execution.

#### NFR-2.3 Documentation

- **Requirement:** All public functions have docstrings; complex logic
  documented inline.
- **Testable:** Documentation coverage scan.

### NFR-3: Maintainability

#### NFR-3.1 Modularity

- **Requirement:** Game logic organized into independent modules: deck
  management, turn execution, scoring, state

persistence.

- **Details:** Each module ≤ 500 lines; single responsibility principle.
- **Testable (Future):** Code review; cyclomatic complexity measurement.

#### NFR-3.2 State Isolation

- **Requirement:** Game state immutable from external modifications; all changes
  via explicit API calls.
- **Testable:** Unit test verifies direct state mutations fail; only API calls
  succeed.

### NFR-4: Usability (Implementation-Dependent)

#### NFR-4.1 Error Messages

- **Requirement:** Invalid moves produce clear error messages indicating why
  capture failed or move rejected.
- **Testable (Future):** Manual/integration test for user-facing feedback.

#### NFR-4.2 State Visibility

- **Requirement:** Implementation must allow querying: current hand, table
  cards, capture pile, score, round number.
- **Testable:** Unit test verifies all query methods return correct values.

---

## REQUIREMENT TRACEABILITY MATRIX

Key traceability checkpoints:

- Core Game, `FR-1.1`, critical, testable: deck validity is fundamental.
- Core Game, `FR-4.1`, critical, testable: capture logic is central gameplay.
- Core Game, `FR-6.1`, critical, testable: escoba scoring is essential.
- Core Game, `FR-8`, high, testable: scoring determines the winner.
- Core Game, `FR-9.1`, critical, testable: win condition is required.
- Setup, `FR-2.1`, critical, testable: the game cannot start without dealing.
- Setup, `FR-3.1`, high, testable: play order affects strategy.
- Rules, `FR-4.4`, medium, testable: the preference rule resolves ambiguity.
- Rules, `FR-6.3`, high, testable: the escoba exception matters.
- Options, `FR-11.3`, low, testable: house rule toggle is optional.
- AI, `FR-12.1`, high, testable: AI player support is a core feature.
- AI, `FR-12.2`, high, testable: async execution avoids UI blocking.
- AI, `FR-12.3`, high, testable: difficulty is configurable.
- AI, `FR-12.4`, medium, testable: move quality uses heuristics.
- UI/UX, `FR-13.1`, high, testable: game mode selection is exposed.
- UI/UX, `FR-13.2`, high, testable: options menu is available.
- UI/UX, `FR-13.3`, high, testable: turn routing is correct.
- Statistics, `FR-14.1`, high, testable: score tracking works.
- Statistics, `FR-14.2`, high, testable: escoba counting works.
- Statistics, `FR-14.3`, medium, testable: win rate is computed.
- Statistics, `FR-14.4`, medium, testable: averages are calculated.
- Statistics, `FR-14.5`, medium, testable: statistics are displayed.
- Statistics, `FR-14.6`, low, testable: session persistence is supported.
- AI Strategy, `FR-15.1`, high, testable: strategy selection menu exists.
- AI Strategy, `FR-15.2`, medium, testable: strategies choose distinct moves.
- AI Strategy, `FR-15.3`, medium, testable: timeouts are integrated.
- File Format, `FR-16.1`, medium, testable: SGF supports setup states.
- File Format, `FR-16.2`, medium, testable: SGF exports move history.
- Configuration, `FR-17.1`, medium, testable: MCTS rollout count is configurable.
- Configuration, `FR-17.2`, medium, testable: Negamax deepening is configurable.
- Configuration, `FR-17.3`, high, testable: source config module is supported.
- Quality, `NFR-2.1`, high, testable: coverage target is defined.
- Performance, `NFR-1.1`, medium, future: non-blocking behavior comes first.

---

## Test Strategy

### Unit Test Organization

1. **test-deck.test.js** → FR-1.1, FR-1.2, NFR-3.2
2. **test-dealing.test.js** → FR-2.1, FR-2.2, FR-2.3, FR-2.4
3. **test-turn.test.js** → FR-3.1, FR-3.2, FR-3.3
4. **test-captures.test.js** → FR-4.1–FR-4.5, FR-5.1
5. **test-escoba.test.js** → FR-6.1–FR-6.4, FR-10.1, FR-10.2
6. **test-scoring.test.js** → FR-8.1–FR-8.6
7. **test-round-end.test.js** → FR-7.1–FR-7.3
8. **test-game-state.test.js** → FR-9.1, FR-9.2, FR-11.1
9. **test-ai-manager.test.js** → FR-12.1, FR-12.2, FR-12.4
10. **test-ui-integration.test.js** → FR-12.3, FR-13.1, FR-13.2, FR-13.3
11. **test-persistence.test.js** → FR-14.1–FR-14.6
12. **test-ai-strategy.test.js** → FR-15.1, FR-15.2, FR-15.3
13. **test-configuration.test.js** → FR-17.1, FR-17.2, FR-17.3

### Coverage Goals

- **Line Coverage:** ≥ 90%
- **Branch Coverage:** ≥ 85%
- **Critical Paths:** 100% (capture logic, scoring, win condition, AI move
  execution)
- **AI Async:** 100% (async task spawning, callback handling)

---

## Assumptions and Constraints

- **Players:** 2 players, any combination of human and AI.
- **Deck:** Standard 40-card Baraja Española; no variant decks.
- **Score Target:** Configurable; default 21.
- **Randomness:** Deck shuffle uses cryptographically sound RNG for fair play.
- **Rule Conflicts:** If implementation allows multiple rule sets, both must be
  independently tested.
- **AI Execution:** AI move computation runs asynchronously; main event loop
  remains responsive.
- **AI Response Time:** Configurable 1–10 seconds; acts as difficulty lever.
- **Game Persistence:** No save/load functionality; statistics persist only
  during session.
- **Statistics Scope:** Tracks single session; resets on application exit (no
  permanent storage).

---

## IMPLEMENTATION DECISIONS (From User Feedback)

- Undo/Replay: **No**. Not implemented.
- AI Player: **Yes**. Runs asynchronously with configurable response time
  from 1 to 10 seconds.
- AI Modes: Human vs Human, Human vs AI, AI vs Human, and AI vs AI.
- AI Strategies: **3 selectable**. Greedy Heuristic, Negamax Alpha-Beta, and
  MCTS/UCT/UCB. Default is Greedy.
- Save/Load Game State: **No**. Not implemented.
- Network Play: **No**. Not implemented.
- Leaderboard: **No**. Multi-session persistence is not implemented.
- Handicaps: **No**. Skill handicaps such as fewer drawn cards are not
  implemented.
- Statistics Tracking: **Yes**. Tracks per-player scores, win rate, and
  average escobas per round.
- Statistics Storage: **Session-only**. No persistence to disk.
- Move Logging: **Yes, for unit testing only**. Move history is logged to
  support test setup and replay of game situations.
- File Format: **SGF (Smart Game Format)**. Used for setup positions and move
  history export.
- MCTS Configuration: **Configurable**. Rollout count is maintained via source
  configuration modules.
- Negamax Strategy: **Iterative Deepening**. Search depth increases within the
  response timeout.
- Configuration Storage: **Source modules**. Human-editable JavaScript modules
  under `javascript/html5/src/config`.
- Future Leaderboards: **JSON**. If added later, leaderboard data would use
  JSON format.

---

## Remaining Design Questions (For Implementation Phase)

- Should SGF export include timestamps or only move sequence?
- What SGF variant best fits Escoba? (Compact custom format or extended standard
  SGF?)
- Should JSON config include per-strategy parameters (e.g., Negamax pruning
  alpha-beta window)?
- How should iterative deepening balance: complete shallower search vs. partial
  deeper search?
