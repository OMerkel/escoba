# Gherkin Scenario and Feature Descriptions

This file formulates unit-testable requirements in Gherkin syntax, organized by
test module.

Format:

```text
Scenario: [Short description]
Feature: [Feature being tested]

Given [Prerequisites]
When [Event/trigger]
Then [Expected outcome]
```

Multiple Given/When/Then statements may exist per Feature/Scenario.

---

## test-card.test.js

### Scenario: Create an Individual Card

Feature: Card Representation (FR-1.1)

Given a card with suit "oros", rank "as", and value 1 When the card is created
Then the card should have suit "oros", rank "as", and value 1

### Scenario: Card Immutability

Feature: Immutable Card Implementation (FR-1.1, NFR-3.2)

Given a card instance When attempting to modify the card's value Then the
operation should fail (freeze prevents modification)

### Scenario: Card Equality Comparison

Feature: Card Equality (FR-1.1)

Given two cards with identical suit and rank ("oros", "as") When comparing them
for equality Then the comparison should return true

Given two cards with different suits ("oros", "as") vs ("copas", "as") When
comparing them for equality Then the comparison should return false

### Scenario: Card Display Name

Feature: Card Display Name (FR-1.1)

Given a card with suit "espadas" and rank "7" When retrieving the display name
Then the display name should be "7 of espadas"

---

## test-deck.test.js

### Scenario: Create Complete 40-Card Deck

Feature: Deck Composition (FR-1.1, FR-1.2)

Given no deck exists When creating a new deck Then the deck should contain
exactly 40 cards

### Scenario: Deck Contains All Suits

Feature: Deck Suit Distribution (FR-1.1)

Given a complete deck When counting cards per suit Then each of the 4 suits
(oros, copas, espadas, bastos) should have exactly 10 cards

### Scenario: Deck Contains All Ranks

Feature: Deck Rank Distribution (FR-1.1)

Given a complete deck When examining all card ranks Then the deck should contain
As(1), 2-7, Sota(8), Caballo(9), Rey(10) in each suit

### Scenario: Card Values Are Correct

Feature: Card Value Mapping (FR-1.2)

Given a complete deck When retrieving card values Then As should equal 1, 2-7
should equal face value, Sota should equal 8, Caballo should equal 9, Rey should
equal 10

### Scenario: Shuffle Produces Different Order

Feature: Deck Shuffle (FR-2.1)

Given a complete deck in sorted order When shuffling the deck Then the shuffled
deck should have different card order (with high probability)

### Scenario: All Cards Present After Shuffle

Feature: Shuffle Integrity (FR-2.1)

Given a complete deck When shuffling Then all 40 cards should still be present
(no duplicates or missing cards)

### Scenario: Draw Cards From Deck

Feature: Deck Draw Mechanics (FR-2.1, FR-2.2)

Given a deck with 40 cards When drawing 5 cards Then 5 unique cards should be
returned And the remaining deck should have 35 cards

### Scenario: Deck Empty State

Feature: Deck Exhaustion (FR-2.3)

Given an empty deck (0 cards) When checking if deck is empty Then the isEmpty
flag should return true

---

## test-game-state.test.js

### Scenario: Initialize New Game State

Feature: Game State Initialization (FR-1.3, FR-11)

Given no game state exists When creating a new GameState Then the phase should
be "setup", round should be 1, and both players should have score 0

### Scenario: Game State Immutability

Feature: Immutable Game State (FR-1.3, NFR-3.2)

Given a GameState instance When attempting to directly modify the phase property
Then the operation should fail (frozen object prevents modification)

### Scenario: FSM Phase Transition

Feature: GameState Phase Transition (FR-1.3, FR-9)

Given a GameState in "setup" phase When transitioning to "dealing" phase Then a
new GameState instance should be created with phase "dealing" And the original
GameState phase should remain "setup"

### Scenario: Game Over Detection

Feature: Game End State (FR-9.1)

Given a GameState with phase "gameEnd" When checking isGameOver property Then
isGameOver should return true

### Scenario: Winning Condition - Player Reaches Target with Minimum Lead

Feature: Game Win Condition (FR-9.1)

Given a GameState with Player 1 score 21 and Player 2 score 19 When calling
isGameOver() Then isGameOver should return true (Player 1 wins: ≥21 points AND
2-point lead)

### Scenario: Winning Condition - Target Score Met But Insufficient Lead

Feature: Game Win Condition (FR-9.1)

Given a GameState with Player 1 score 21 and Player 2 score 20 When calling
isGameOver() Then isGameOver should return false (only 1-point lead; game
continues)

### Scenario: Winning Condition - Both Players At Or Above Target, Tied

Feature: Game Win Condition (FR-9.1)

Given a GameState with Player 1 score 21 and Player 2 score 21 When calling
isGameOver() Then isGameOver should return false (tied at target; game
continues)

### Scenario: Winning Condition - Higher Scores with Sufficient Lead

Feature: Game Win Condition (FR-9.1)

Given a GameState with Player 1 score 25 and Player 2 score 23 When calling
isGameOver() Then isGameOver should return true (≥21 points AND 2-point lead)

### Scenario: Winning Condition - Higher Scores with Insufficient Lead

Feature: Game Win Condition (FR-9.1)

Given a GameState with Player 1 score 25 and Player 2 score 24 When calling
isGameOver() Then isGameOver should return false (only 1-point lead; game
continues)

### Scenario: Alternative Target Score Configuration

Feature: Configurable Target Score (FR-11.1)

Given a GameState with targetScore 15 and Player 1 score 15, Player 2 score 13
When calling isGameOver() Then isGameOver should return true (applies same
2-point lead rule to alternative targets)

### Scenario: Get Current Player

Feature: Current Player Access (FR-3.1)

Given a GameState with two players (p1, p2) When getting currentPlayer with
index 0 Then currentPlayer should be p1

### Scenario: Custom Target Score Configuration

Feature: Target Score Setting (FR-11.1)

Given creating a GameState with targetScore 15 When retrieving targetScore Then
targetScore should be 15

### Scenario: Setenta Method Configuration

Feature: Setenta Method Selection (FR-11.2)

Given creating a GameState with setentaMethod "numerical" When retrieving
setentaMethod Then setentaMethod should be "numerical"

---

## test-dealing.test.js

### Scenario: Initial Deal Distribution

Feature: Initial Deal (FR-2.1)

Given a shuffled deck with 40 cards When executing initialDeal() Then player 1
should receive 3 cards And player 2 should receive 3 cards And table should
receive 4 cards And remaining deck should have 30 cards

### Scenario: Re-Deal Without Table Cards

Feature: Re-Deal Mechanics (FR-2.2)

Given a deck with 30+ cards remaining When executing reDeal() Then player 1
should receive 3 new cards And player 2 should receive 3 new cards And table
cards should remain unchanged

### Scenario: Stock Exhaustion After 6 Dealing Phases

Feature: Deck Exhaustion (FR-2.3)

Given initial deal plus 5 re-deals When checking remaining cards Then all 40
cards should be dealt And remaining deck should be empty

### Scenario: Final Table Card Award to Last Capturer

Feature: Final Card Award (FR-7.2)

Given a player who made the last capture When round ends with 2 cards remaining
on table Then those 2 cards should be added to the last capturer's pile

---

## test-turn.test.js

### Scenario: Create Turn for Player

Feature: Turn Initialization (FR-3.1, FR-3.2)

Given a player and empty table When creating a Turn instance Then the turn
should belong to the player And cardPlayed should be null

### Scenario: Play Card in Turn

Feature: Card Play (FR-3.2)

Given a turn with no card played When playing a card Then cardPlayed should be
set to that card

### Scenario: Select Capture Set

Feature: Capture Selection (FR-3.2, FR-4.2)

Given a turn with card played When selecting a capture set of 2 table cards Then
captureSet should contain those 2 cards

### Scenario: Discard Without Capture

Feature: Discard Play (FR-3.2, FR-5.1)

Given a turn with card played and no valid capture When discarding Then
captureSet should be empty

---

## test-captures.test.js

### Scenario: Find Valid 15-Sum Captures

Feature: Capture Validation (FR-4.1)

Given a played card value 7 and table cards [6, 8, 2] When getting valid
captures Then valid captures should include [8] (8+7=15)

### Scenario: Single-Card Capture

Feature: Single Complement Capture (FR-4.1)

Given a played card 5 and table [10, 2, 3] When getting valid captures Then
valid captures should include [10] (single-card complement)

### Scenario: Multi-Card Capture

Feature: Multi-Card Combination (FR-4.1)

Given a played card 5 and table [6, 4, 8] When getting valid captures Then valid
captures should include [6, 4] (6+4+5=15)

### Scenario: No Valid Captures

Feature: Capture Impossible (FR-4.1)

Given a played card 1 and table [2, 3] When getting valid captures Then valid
captures should be empty

### Scenario: Detect Capture Availability

Feature: Capture Detection (FR-4.1)

Given played card 15 and table [7, 8] When checking hasCapture Then hasCapture
should return true

### Scenario: Single-Complement Preference Enforcement

Feature: Single-Complement Priority (FR-4.4)

Given captures include both [10] (single) and [6, 4] (multi) When applying
single-complement preference Then only [10] should remain as valid capture

---

## test-escoba.test.js

### Scenario: Detect Escoba When Table Cleared

Feature: Escoba Detection (FR-6.1)

Given table with 1 card (value 7) When capturing with played card (value 7) Then
isEscoba should return true

### Scenario: No Escoba When Table Partially Captured

Feature: Partial Capture (FR-6.1)

Given table with 3 cards and capturing only 2 When checking isEscoba Then
isEscoba should return false

### Scenario: Award Escoba Point to Player

Feature: Escoba Point Attribution (FR-6.2)

Given a player with 0 escobas When awarding an escoba Then escobas count should
increment to 1

### Scenario: Automatic Final Table Award Is Not Escoba

Feature: End-of-Round Final Award (FR-6.3)

Given leftover table cards and a last capturer at round end When awarding those
leftover cards automatically Then the cards should be added to that player's
pile And no escoba should be awarded

### Scenario: Intermediate-Hand Sweep Still Scores Escoba

Feature: Escoba Detection Across Re-deals (FR-6.4)

Given house rule "no escoba on final card" enabled And a table-clearing capture
using a player's last card in hand And stock still remains for a re-deal When
resolving the capture Then escoba should still be awarded

### Scenario: Final-Round Sweep Does Not Score Under House Rule

Feature: Final Card of Round Escoba Suppression (FR-6.4, FR-11.3)

Given house rule "no escoba on final card" enabled And a table-clearing capture
using a player's last card in hand And stock is exhausted When resolving the
capture Then escoba should NOT be awarded

### Scenario: Initial Table Totals 15

Feature: Special Initial Condition 15 (FR-10.1)

Given initial table with cards summing to 15 (e.g., [7, 6, As, As]) When
checking special condition Then dealer should immediately capture all 4 cards
And dealer should receive 1 escoba point
And opening mandatory capture should be shown in `captureDisplay` before normal
play continues

### Scenario: Initial Table Totals 30

Feature: Special Initial Condition 30 (FR-10.2)

Given initial table with cards summing to 30 (e.g., [10, 10, 10, 0]) When
checking special condition Then dealer should immediately capture all 4 cards
And dealer should receive 2 escoba points
And opening mandatory capture should be shown in `captureDisplay` before normal
play continues

---

## test-scoring.test.js

### Scenario: Score Cards Category (Majority)

Feature: Cards Scoring (FR-8.1)

Given player 1 with 25 captured cards, player 2 with 15 When scoring cards
category Then player 1 should receive 1 point

### Scenario: Cards Category Tie

Feature: Cards Tie (FR-8.1)

Given both players with exactly 20 captured cards When scoring cards category
Then neither player should receive a point

### Scenario: Score Oros Category (Majority)

Feature: Oros Scoring (FR-8.2)

Given player 1 with 6 oros, player 2 with 4 oros When scoring oros category Then
player 1 should receive 1 point

### Scenario: Score 7 of Oros

Feature: 7 of Oros Scoring (FR-8.3)

Given player 1 has the 7 of oros card When scoring 7 of oros category Then
player 1 should receive 1 point

### Scenario: Score Escobas

Feature: Escoba Points (FR-8.5)

Given player 1 with 3 escobas made, player 2 with 1 When scoring escobas Then
player 1 should receive 3 points, player 2 should receive 1 point

### Scenario: Round Scoring Summary

Feature: Complete Round Scoring (FR-8.6)

Given final captures and escobas for both players When calculating round score
Then cumulative points should equal: cards + oros + 7oros + setenta + escobas

---

## test-rules.test.js

### Scenario: Detect Forced Capture Rule

Feature: Forced Capture Enforcement (FR-4.3)

Given played card 7 and table [8] When checking if capture is forced Then
isCaptureForced should return true

### Scenario: Discard Allowed When No Capture Available

Feature: Discard Without Forced Capture (FR-4.3)

Given played card 1 and table [2, 3] When checking if capture is forced Then
isCaptureForced should return false And discard should be allowed

### Scenario: Validate Correct Capture Sum

Feature: Capture Sum Validation (FR-4.1)

Given played card 5, selected capture [10] When validating move Then validation
should pass (5+10=15)

### Scenario: Reject Incorrect Capture Sum

Feature: Invalid Capture Sum Rejection (FR-4.1)

Given played card 5, selected capture [6] When validating move Then validation
should fail (5+6≠15)

### Scenario: Enforce Special Initial Condition

Feature: Special Initial Totals Validation (FR-10)

Given initial table summing to 15 When checking special initial condition Then
condition flag should return true And dealer should be forced to capture

---

## test-round-end.test.js

### Scenario: Detect Round Completion

Feature: Round End Detection (FR-7.1)

Given stock exhausted and both players played 3-card hand When checking round
completion condition Then round should be marked as complete

### Scenario: Award Remaining Table Cards

Feature: Final Card Award (FR-7.2)

Given 2 cards on table at round end When executing round end Then last capturer
should receive those 2 cards in pile And no escoba point awarded for final award

### Scenario: Handle Empty Table at Round End

Feature: Empty Table on Round End (FR-7.3)

Given table is empty at round end (already cleared by last capture) When
executing round end Then no cards to award And game should proceed to scoring

---

## test-ai-strategy.test.js

### Scenario: AI Prioritizes Escobas

Feature: Greedy Strategy Escoba Priority (FR-15.1a, FR-12.4)

Given board state with escoba capture available and regular capture available
When AI calculates move (greedy strategy) Then AI should select escoba capture

### Scenario: AI Prioritizes 7 of Oros

Feature: Greedy Strategy 7 Oros Priority (FR-15.1a, FR-12.4)

Given board state with 7 of oros capture available and other captures When AI
calculates move (greedy strategy) Then AI should select 7 of oros capture

### Scenario: AI Selects Highest Value Capture

Feature: Greedy Strategy Value Priority (FR-15.1a, FR-12.4)

Given board state with captures valued [5 cards], [3 cards], [2 cards] When AI
calculates move (greedy strategy) Then AI should select highest value capture (5
cards)

### Scenario: AI Selects Safe Discard

Feature: Greedy Strategy Safe Discard (FR-15.1a, FR-12.4)

Given board state with no valid capture and multiple discard options When AI
calculates move (greedy strategy) Then AI should select discard that leaves safe
table state

---

## test-ai-manager.test.js

### Scenario: Generate AI Move Asynchronously

Feature: Async AI Move Execution (FR-12.2)

Given a game state and AI player configuration When AI manager generates move
Then move computation should run asynchronously And should return result via
Promise/callback

### Scenario: Respect Response Time Limit

Feature: AI Response Time Constraint (FR-12.3, FR-12.2)

Given configured response time of 5 seconds When AI manager computes move Then
move should complete within 5 seconds ± 200ms

### Scenario: Select Strategy Based on Configuration

Feature: Strategy Selection (FR-15.1)

Given strategy configured as "greedy" When AI manager initializes Then greedy
strategy instance should be created

### Scenario: Validate AI Move Legality

Feature: AI Move Validation (FR-12.1)

Given AI-computed move When validating move legality Then move should pass
capture validation or be legal discard And move should not violate
forced-capture rule

### Scenario: Support Game Mode Routing

Feature: Game Mode Turn Routing (FR-13.3)

Given game mode is "HumanVsAI" When it is human's turn Then game waits for human
input When it is AI's turn Then game triggers AI move computation

---

## test-negamax.test.js

### Scenario: Perform Negamax Search

Feature: Negamax Algorithm (FR-15.1b)

Given a game state with available moves When running negamax search at depth 3
Then search should evaluate legal moves and return best move

### Scenario: Apply Alpha-Beta Pruning

Feature: Alpha-Beta Pruning (FR-15.1b)

Given a game tree with alpha-beta bounds When searching with pruning enabled
Then unnecessary branches should be pruned (verified by node count reduction)

### Scenario: Implement Iterative Deepening

Feature: Iterative Deepening Within Timeout (FR-17.2)

Given response time of 5 seconds When running negamax with iterative deepening
Then search should progress depth 1 → 2 → 3 → 4 → ... until timeout And final
result should be from deepest completed depth

### Scenario: Improve Move Quality With Longer Timeout

Feature: Timeout-Adaptive Search (FR-17.2)

Given two negamax runs with different timeouts (1 sec vs 5 sec) When comparing
resulting moves Then longer timeout should produce stronger move (deeper search)

---

## test-mcts.test.js

### Scenario: Perform MCTS Tree Search

Feature: MCTS Algorithm (FR-15.1c)

Given a game state When running MCTS Then algorithm should perform Selection →
Expansion → Simulation → Backpropagation cycles

### Scenario: Apply UCB1 Selection Strategy

Feature: UCB1 Node Selection (FR-15.1c)

Given MCTS tree with multiple child nodes When selecting next node to explore
Then selection should use UCB1 formula balancing exploitation and exploration

### Scenario: Execute Random Rollouts

Feature: MCTS Simulation Rollouts (FR-15.1c)

Given configured rollout count of 1000 When MCTS runs simulations Then exactly
1000 random game simulations should execute And statistics should accumulate
from rollout results

### Scenario: Backpropagate Statistics

Feature: MCTS Backpropagation (FR-15.1c)

Given simulation result (win/loss) When backpropagating through tree Then all
ancestor nodes should update visit count and win statistics

---

## test-persistence.test.js

### Scenario: Load Configuration From JSON

Feature: Configuration Loading (FR-17.3)

Given a valid configuration object with settings in source modules When loading
configuration Then all parameters should be parsed and available (targetScore,
AI strategy, etc.)

### Scenario: Validate Configuration File

Feature: Configuration Validation (FR-17.3)

Given an invalid configuration object (schema mismatch) When attempting to load
Then error should be raised with clear message

### Scenario: Export Game to SGF Format

Feature: SGF Game Export (FR-16.2)

Given a completed game with move history When exporting to SGF Then SGF file
should contain all moves, scores, and player information And file should be
human-readable

### Scenario: Parse SGF Game Situation

Feature: SGF Parsing (FR-16.1)

Given an SGF file defining game situation When parsing SGF Then game state
should be initialized with correct hand, table, and pile cards

### Scenario: Track Player Statistics

Feature: Statistics Persistence (FR-14.1, FR-14.2)

Given multiple completed rounds When tracking statistics Then cumulative scores
and escoba counts should accumulate correctly

### Scenario: Calculate Win Rate

Feature: Win Rate Computation (FR-14.3)

Given 10 rounds played with 7 wins for player 1 When calculating win rate Then
win rate should be 70%

### Scenario: Calculate Average Escobas Per Round

Feature: Average Escoba Calculation (FR-14.4)

Given 5 rounds with escoba counts [2, 1, 3, 0, 2] When calculating average Then
average should be 1.6 escobas per round

---

## test-ui-integration.test.js

### Scenario: Render Game Board

Feature: Game View Rendering (NFR-4.1, NFR-4.2)

Given a game state When rendering game view Then board should display table
cards, player hands, scores, and current player indicator

### Scenario: Accept Card Selection Input

Feature: User Card Selection (NFR-4.1)

Given rendered game board with playable cards When user selects a card Then card
should be highlighted And play action should be triggered

### Scenario: Support Keyboard Navigation

Feature: Keyboard Navigation (NFR-4.2, FR-13.3)

Given game board rendered When user presses arrow keys and Enter Then navigation
should work without mouse And card selection/play should function via keyboard

### Scenario: Display Error Messages for Invalid Moves

Feature: Move Validation Feedback (NFR-4.1)

Given user attempts invalid move When move validation fails Then clear error
message should display indicating reason (e.g., "Capture is mandatory")

### Scenario: Show Statistics View

Feature: Statistics Display (FR-14.5)

Given game completed When accessing Statistics view Then display should show
player names, scores, win rates, escoba counts

### Scenario: Display Opening Mandatory Capture Before First Turn

Feature: Opening Special Capture Visualization (FR-10.1, FR-10.2, FR-UI-1.1)

Given initial table totals 15 or 30 When a new game starts Then UI should enter
`captureDisplay` and show the opening captured set before first turn input is
accepted

---

## test-configuration.test.js

### Scenario: Configure Target Score

Feature: Target Score Option (FR-11.1)

Given game configuration with target score 15 When game runs Then game should
end when player reaches 15 (not 21)

### Scenario: Select Setenta Method

Feature: Setenta Method Selection (FR-11.2)

Given configuration with setentaMethod "numerical" When scoring round Then 7=21,
6=18, As=16 values should apply (not prime method)

### Scenario: Enable/Disable Final Card Escoba Rule

Feature: House Rule Configuration (FR-11.3)

Given house rule "no escoba on final card" enabled When capture occurs with the
player's final card of the round and clears table Then escoba should NOT be
awarded

Given house rule disabled When capture occurs with the player's final card of
the round and clears table Then escoba SHOULD be awarded

### Scenario: Configure MCTS Rollout Count

Feature: MCTS Configuration (FR-17.1)

Given configuration with mctsRolloutsPerDecision = 500 When MCTS strategy runs
Then exactly 500 rollout simulations should execute (not default 1000)

### Scenario: Load Negamax Parameters

Feature: Negamax Configuration (FR-17.2)

Given configuration loaded When negamax strategy initializes Then iterative
deepening should use configured timeout window And alpha-beta pruning windows
should be initialized from config

### Scenario: Configure Mandatory Capture Display Duration

Feature: Mandatory Capture Display Timing (FR-UI-1.3)

Given configuration with mandatoryCaptureDisplayDurationMs = 6000 When
capture-display flow runs Then preview visibility duration should be 6000ms

---

## test-config-constants.test.js

### Scenario: Validate Static Configuration Constants

Feature: Configuration Constants Integrity (FR-11, FR-17)

Given exported configuration constants in src/config/constants.js When checking
target scores, suits, and rank definitions Then values should match the game
rule model

---

## test-messages.test.js

### Scenario: Validate Game Message Templates

Feature: Message Template Consistency (NFR-4.1)

Given centralized message templates in src/config/messages.js When rendering
static and dynamic messages Then output should be deterministic and readable for
UI feedback

---

## End of Gherkin Specifications

Total Scenarios: 80+ Total Features Covered: 54 requirements (FR-1 through
FR-17, NFR-1 through NFR-4) Test Modules: 17
