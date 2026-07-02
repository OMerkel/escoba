# Escoba de Quince - Software Architecture

## Architecture Overview

This document defines the software architecture for a digital implementation of
Escoba de Quince in HTML5/JavaScript. The architecture is organized around
**separation of concerns**, **modularity**, and **testability** to support the
formal requirements in [requirements.md](requirements.md) and the current
JavaScript test suite.

### High-Level Design Principles

1. **Layered Architecture**: Presentation -> Game Logic -> AI Engines -> Data
   Persistence
2. **Modular Components**: Each major system (Deck, Turn, Capture, Scoring, AI)
   in independent modules
3. **Event-Driven**: UI updates driven by game state changes (observer pattern)
4. **Asynchronous AI**: Background worker threads for non-blocking AI
   computation
5. **Testable**: Core logic decoupled from UI; all game rules in pure functions

---

## Project Structure

```text
escoba/
|-- javascript/
|   `-- html5/
|       |-- src/
|       |   |-- index.html                 # Entry point; UI shell
|       |   |-- index.js                   # App bootstrapper
|       |   |-- css/                       # Stylesheets
|       |   |-- core/                      # Game logic
|       |   |-- ai/                        # AI engines and strategies
|       |   |-- persistence/               # SGF and statistics persistence
|       |   |-- utils/                     # Logging and event utilities
|       |   |-- ui/                        # UI views and components
|       |   |-- workers/                   # Web Worker modules
|       |   |-- config/                    # Configuration and messages
|       |   |-- img/                       # Canonical card assets
|       |   `-- test/                      # Vitest test suite
|       |-- dist/                          # Static build output
|       |-- package.json
|       |-- vite.config.js
|       `-- vitest.config.js
|-- script/
|   `-- tournament/                        # Tournament, diagnostics, analysis
`-- doc/
    |-- requirements.md                    # Formal requirements
    |-- rules.md                           # Game rules
    |-- gherkin.md                         # Scenario coverage
    |-- software_architecture.md           # This index document
    |-- software_architecture_modules.md   # Module-level responsibilities
    |-- software_architecture_runtime.md   # Runtime flows and interactions
    |-- software_architecture_quality.md   # Testing, build, NFRs
    `-- software_architecture_diagrams.md  # Architecture and flow diagrams
```

---

## Architecture Document Map

This document is the entry point for the split architecture set:

- [software_architecture_modules.md](software_architecture_modules.md):
  file-level responsibilities, algorithms, and architectural roles
- [software_architecture_runtime.md](software_architecture_runtime.md):
  initialization, turn flow, scoring flow, and component interactions
- [software_architecture_quality.md](software_architecture_quality.md): testing
  strategy, build/deployment model, and non-functional requirements
- [software_architecture_diagrams.md](software_architecture_diagrams.md):
  system, sequence, scoring, capture, and state-machine diagrams

---

## System Scope

The browser application is responsible for:

- modeling the Spanish deck and card values used by Escoba de Quince;
- validating captures, discards, escobas, and round transitions;
- computing round and game scores;
- supporting human and AI-driven turns through a shared engine;
- exporting and importing SGF-style game state data;
- collecting session-level statistics and diagnostics;
- supporting static `dist` deployment with relative assets.

---

## Key Design Decisions

- **Immutable GameState boundaries**: support predictable updates, easier tests,
  and future replay or undo features.
- **Event-Driven UI**: decouples game logic from presentation and keeps the
  system easier to test and refactor.
- **Web Worker for AI**: prevents main-thread blocking during AI computation,
  even with configurable response delays.
- **Config-Driven AI**: keeps Greedy, Negamax, and MCTS swappable without code
  changes and leaves room for future strategies.
- **Module-Based Config**: configuration lives in `src/config/configuration.js`,
  `src/config/constants.js`, and `src/config/messages.js` instead of the old
  JSON-only architecture draft.
- **Relative Image Paths**: runtime asset references use `img/deck/...` so both
  development serving and static `dist` serving behave consistently.
- **Post-Build Asset Copy**: Vite builds application assets while the image tree
  is copied from `src/img` into `dist/img` to preserve one source of truth.
- **Session-Scoped Statistics**: simplifies implementation while keeping richer
  persistent statistics as a future enhancement.
- **SGF Support via Persistence Module**: SGF parse/export capabilities are
  implemented inside `src/persistence/persistence-manager.js` rather than in
  separate parser/exporter files.

---

## Future Extensibility

The architecture supports these potential enhancements:

1. **Network Multiplayer**: replace local AI with network opponents without
   rewriting core rule modules.
2. **Persistent Statistics**: add storage-backed statistics while preserving the
   existing statistics manager contract.
3. **Additional AI Strategies**: implement new strategy modules and register
   them through the AI manager.
4. **Game Replay and Undo**: reuse state-transition discipline to support richer
   replay tooling.
5. **Variant Rules**: add new configuration toggles and scoring/rule dispatch.
6. **Mobile-Specific UI**: keep core rules and AI intact while replacing the
   presentation layer.

---

## Summary

This architecture provides a **scalable, testable, and maintainable**
implementation of Escoba de Quince in HTML5/JavaScript. It organizes code into
clear domains for core logic, AI, UI, persistence, configuration, and supporting
utilities. **Async AI execution** via Web Workers keeps the UI responsive, while
**structured state transitions** and focused tests support reliable gameplay
evolution.
