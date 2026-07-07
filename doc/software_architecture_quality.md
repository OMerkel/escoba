# Software Architecture Quality

## Testing Strategy

### Test Pyramid

```text
        ▲
        │
    Integration and Regression Tests
        │     - Full game flows
        │     - Round mechanics
        │     - UI regressions
        │
    Unit Tests
        │     - Core rules and scoring
        │     - AI and heuristics
        │     - Persistence and config
        │
    Foundation
              - Constants, utilities, helpers
```

The project emphasizes low-friction logic testing first, then integration and
regression checks for user-visible behavior.

### Test Execution

```bash
# Run all tests
npm test

# Coverage report
npm run test:coverage

# Build validation
npm run build
```

Coverage execution is configured as a one-shot run so it behaves predictably in
CI and scripted local validation.

### Current Test Areas

The active suite covers:

- card modeling, deck creation, and dealing;
- capture legality, escoba behavior, house-rule edge cases, and scoring;
- game-state and engine transitions;
- AI manager, strategy, negamax, MCTS, and heuristics;
- persistence and tournament flows;
- configuration constants, message templates, and asset consistency;
- UI integration and regression scenarios.

Implementation-specific quality checks currently reflected in code and tests:

- round-end helper module behavior (`round-end.js`) including completion and
  transition helpers;
- configuration schema validation and preset handling in
  `config/configuration.js`;
- shell-level integration behavior (overlay/options flow and runtime restarts)
  centered in `index.js` + `game-controller.js`.
- final-card-of-round escoba suppression semantics, including the distinction
  between intermediate hand exhaustion and true round-end stock exhaustion.

**Coverage Target**: at least 80 percent for line, branch, statement, and
function coverage in the current Vitest configuration.

---

## Deployment and Build

### Development

```bash
# Start dev server with hot reload
npm run dev
```

### Production Build

```bash
# Bundle and emit static output
npm run build
```

Current build characteristics:

- Vite uses `src` as the application root.
- Vite emits output to `dist`.
- Build output uses `./` as the base path for static compatibility.
- A build step copies `src/img` into `dist/img`.

### Deployment Target

```text
dist/
    index.html
    assets/*.js
    assets/*.css
    img/deck/.../*.svg
```

The architecture explicitly supports folder-based static hosting, including Live
Server-style serving of the built `dist` directory.

---

## NFR Compliance

### NFR-1: Performance

- **Turn Latency (NFR-1.1)**: game logic should remain lightweight for browser
  execution; async AI must not block the UI thread.
- **Round Completion (NFR-1.2)**: round resolution is expected to stay within
  practical browser-interaction limits on typical hardware.

### NFR-2: Code Quality

- **Test Coverage (NFR-2.1)**: automated coverage checks protect rules and
  regressions.
- **Formatting and Linting (NFR-2.2)**: Biome and Markdown tooling keep source
  and documentation consistent.
- **Documentation (NFR-2.3)**: architectural intent is kept traceable through
  these split documents and test references.

### NFR-3: Maintainability

- **Modularity (NFR-3.1)**: files are organized by single primary
  responsibility.
- **Dependencies (NFR-3.2)**: the browser runtime relies on a compact set of
  libraries and native platform features.
- **Code Structure**: layered architecture separates UI, logic, AI, and
  persistence.

### NFR-4: Usability and Portability

- **Clarity (NFR-4.1)**: consistent UI conventions and centralized messages.
- **Portability (NFR-4.2)**: browser-native runtime with no backend dependency.
- **Static Hosting Compatibility (NFR-4.3)**: relative assets support both dev
  and built deployments.

Current runtime implementation detail for portability: statistics are persisted
in browser `localStorage` (`escoba_stats`), which keeps deployment backend-free
but scopes persistence to the local browser profile.

---

## Main Risks and Mitigations

- **Rule regression risk**: mitigated by focused core tests and scoring tests.
- **AI responsiveness risk**: mitigated by bounded AI timing and isolated
  strategy modules.
- **Static asset risk**: mitigated by relative asset URLs and the image copy
  step.
- **Documentation drift risk**: mitigated by splitting the architecture into
  module, runtime, quality, and diagram views.
