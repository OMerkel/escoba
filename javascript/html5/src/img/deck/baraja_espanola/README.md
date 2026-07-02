# Baraja Espanola

Copyright 2026 Oliver Merkel, <merkel.oliver@web.de>

## Structure

40-card Spanish deck with these four suits:

- Oros (Coins)
- Copas (Cups)
- Espadas (Swords)
- Bastos (Clubs or Batons)

Each suit contains these ranks:

- As (Ace)
- 2
- 3
- 4
- 5
- 6
- 7
- Sota
- Caballo
- Rey

## Assets

Run the generator to create the complete SVG deck in this folder:

```bash
python generate_baraja_espanola.py
```

Or run the VS Code task `Generate Baraja Espanola Deck`.

Generated files:

- `oros_as.svg` through `oros_rey.svg`
- `copas_as.svg` through `copas_rey.svg`
- `espadas_as.svg` through `espadas_rey.svg`
- `bastos_as.svg` through `bastos_rey.svg`
- `baraja_espanola_back.svg`
- `baraja_espanola_sheet.svg`

The card faces are rendered as traditional-style vector artwork intended to stay
close to a classic printed Baraja Espanola look while remaining lightweight and
editable.
