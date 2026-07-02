# Escoba de Quince

Classic Spanish card game Escoba de Quince with human and AI play modes.

## Play Online

- [Start game now...](https://omerkel.github.io/escoba/javascript/html5/src/)

## Repository Layout

- `javascript/html5/` - browser implementation (Vite + Vitest)
- `doc/` - formal requirements, rules, and software architecture documentation
- `script/tournament/` - AI tournament and strategy analysis scripts

## PWA Support

The HTML5 application supports Progressive Web App behavior:

- browser-native installation via each user agent's own install/add-to-home-screen UI;
- intentional UX policy: no in-app install button, hint, or prompt handling;
- service worker based offline asset caching;
- web app manifest metadata for installable browser experience.

For setup and usage details, see `javascript/html5/README.md`.
