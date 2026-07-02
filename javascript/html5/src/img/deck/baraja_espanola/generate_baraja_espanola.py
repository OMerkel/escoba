"""Generate a traditional-style 40-card Baraja Espanola SVG deck."""

# flake8: noqa
# pylint: disable=line-too-long
from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path


CARD_WIDTH = 750
CARD_HEIGHT = 1200
CENTER_X = CARD_WIDTH / 2
CENTER_Y = CARD_HEIGHT / 2
SHEET_COLUMNS = 5
SHEET_THUMB_WIDTH = 180
SHEET_THUMB_HEIGHT = 288
SHEET_WIDTH = 1120
SHEET_HEIGHT = 2920
SHEET_MARGIN_X = 76
SHEET_MARGIN_Y = 96
SHEET_GAP_X = 24
SHEET_GAP_Y = 18


@dataclass(frozen=True)
# pylint: disable=too-many-instance-attributes
class Suit:
    """Color and naming metadata for one Spanish suit."""

    key: str
    name: str
    file: str
    accent: str
    dark: str
    soft: str
    banner: str
    figure: str


@dataclass(frozen=True)
class Rank:
    """Display and gameplay metadata for one card rank."""

    key: str
    label: str
    name: str
    value: int
    face: bool


SUITS = (
    Suit("oros", "Oros", "oros", "#c28a1e", "#784b0b", "#f4d78a", "#8f6713", "#9f7825"),
    Suit("copas", "Copas", "copas", "#a3352f", "#5d1717", "#e9b4a8", "#7f2424", "#8f3a30"),
    Suit("espadas", "Espadas", "espadas", "#436b83", "#243746", "#bdd0dc", "#39596f", "#5d8497"),
    Suit("bastos", "Bastos", "bastos", "#5c6b2d", "#314116", "#b4c08b", "#556227", "#6d5526"),
)


RANKS = (
    Rank("as", "1", "As", 1, False),
    Rank("2", "2", "Dos", 2, False),
    Rank("3", "3", "Tres", 3, False),
    Rank("4", "4", "Cuatro", 4, False),
    Rank("5", "5", "Cinco", 5, False),
    Rank("6", "6", "Seis", 6, False),
    Rank("7", "7", "Siete", 7, False),
    Rank("sota", "10", "Sota", 10, True),
    Rank("caballo", "11", "Caballo", 11, True),
    Rank("rey", "12", "Rey", 12, True),
)


def format_number(value: float) -> str:
    """Format SVG numeric values without unnecessary trailing zeros."""

    if float(value).is_integer():
        return str(int(value))
    text = f"{value:.4f}".rstrip("0").rstrip(".")
    return text or "0"


def svg_document(body: str, title: str) -> str:
    """Wrap a card body fragment in the shared SVG document shell."""

    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{CARD_WIDTH}" height="{CARD_HEIGHT}" viewBox="0 0 {CARD_WIDTH} {CARD_HEIGHT}" role="img" aria-labelledby="title desc">
  <title id="title">{title}</title>
  <desc id="desc">Traditional-style Baraja Espanola playing card.</desc>
  <defs>
    <linearGradient id="paperGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fffdf6"/>
      <stop offset="100%" stop-color="#f5eddc"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.18"/>
    </filter>
  </defs>
  {body}
</svg>
'''


def card_frame(suit: Suit) -> str:
    """Return the clean frame used by every card face - simplified for small sizes."""

    return f'''  <rect x="18" y="18" width="714" height="1164" rx="34" fill="url(#paperGradient)" stroke="#1f1b16" stroke-width="5" filter="url(#shadow)"/>
  <rect x="40" y="40" width="670" height="1120" rx="24" fill="none" stroke="{suit.banner}" stroke-width="4"/>'''


def coin_symbol(suit: Suit, x: float, y: float, scale: float = 1.0, rotate: float = 0) -> str:
    """Render an Oros pip at the requested position."""

    inner = 26 * scale
    mid = 36 * scale
    outer = 46 * scale
    star = 18 * scale
    stroke = max(2, 3 * scale)
    return f'''<g transform="translate({format_number(x)} {format_number(y)}) rotate({format_number(rotate)})">
  <circle r="{format_number(outer)}" fill="{suit.soft}" stroke="{suit.dark}" stroke-width="{format_number(stroke)}"/>
  <circle r="{format_number(mid)}" fill="none" stroke="{suit.accent}" stroke-width="{format_number(stroke)}"/>
  <circle r="{format_number(inner)}" fill="#fbf4d9" stroke="{suit.dark}" stroke-width="{format_number(stroke)}"/>
  <path d="M 0 -{format_number(star)} L {format_number(star)} 0 L 0 {format_number(star)} L -{format_number(star)} 0 Z" fill="{suit.accent}" stroke="{suit.dark}" stroke-width="{format_number(stroke)}"/>
  <path d="M -{format_number(star)} 0 L 0 -{format_number(star)} L {format_number(star)} 0 L 0 {format_number(star)} Z" fill="none" stroke="{suit.dark}" stroke-width="{format_number(stroke)}"/>
</g>'''


def cup_symbol(suit: Suit, x: float, y: float, scale: float = 1.0, rotate: float = 0) -> str:
    """Render a Copas pip at the requested position."""

    width = 30 * scale
    height = 48 * scale
    stem = 12 * scale
    base = 26 * scale
    stroke = max(2, 3 * scale)
    return f'''<g transform="translate({format_number(x)} {format_number(y)}) rotate({format_number(rotate)})">
  <path d="M -{format_number(width)} -{format_number(height)} C -{format_number(width)} {format_number(-18*scale)}, {format_number(-18*scale)} {format_number(4*scale)}, 0 {format_number(10*scale)} C {format_number(18*scale)} {format_number(4*scale)}, {format_number(width)} {format_number(-18*scale)}, {format_number(width)} -{format_number(height)} Z" fill="{suit.soft}" stroke="{suit.dark}" stroke-width="{format_number(stroke)}"/>
  <path d="M {format_number(-18*scale)} -{format_number(height)} C {format_number(-10*scale)} {format_number(-66*scale)}, {format_number(10*scale)} {format_number(-66*scale)}, {format_number(18*scale)} -{format_number(height)}" fill="none" stroke="{suit.accent}" stroke-width="{format_number(stroke)}"/>
  <path d="M {format_number(-6*scale)} {format_number(10*scale)} L -{format_number(stem)} {format_number(38*scale)} L {format_number(stem)} {format_number(38*scale)} L {format_number(6*scale)} {format_number(10*scale)} Z" fill="{suit.accent}" stroke="{suit.dark}" stroke-width="{format_number(stroke)}"/>
  <rect x="-{format_number(base)}" y="{format_number(38*scale)}" width="{round(base * 2)}" height="{round(10 * scale)}" rx="{round(3 * scale)}" fill="{suit.accent}" stroke="{suit.dark}" stroke-width="{format_number(stroke)}"/>
  <path d="M {format_number(-26*scale)} {format_number(-28*scale)} C {format_number(-36*scale)} {format_number(-22*scale)}, {format_number(-38*scale)} {format_number(-4*scale)}, {format_number(-24*scale)} {format_number(4*scale)}" fill="none" stroke="{suit.dark}" stroke-width="{format_number(stroke)}"/>
  <path d="M {format_number(26*scale)} {format_number(-28*scale)} C {format_number(36*scale)} {format_number(-22*scale)}, {format_number(38*scale)} {format_number(-4*scale)}, {format_number(24*scale)} {format_number(4*scale)}" fill="none" stroke="{suit.dark}" stroke-width="{format_number(stroke)}"/>
</g>'''


def sword_symbol(suit: Suit, x: float, y: float, scale: float = 1.0, rotate: float = 0) -> str:
    """Render an Espadas pip at the requested position."""

    blade = 70 * scale
    stroke = max(2, 3 * scale)
    guard = 26 * scale
    handle = 18 * scale
    return f'''<g transform="translate({format_number(x)} {format_number(y)}) rotate({format_number(rotate)})">
  <path d="M 0 -{format_number(blade)} L {format_number(10*scale)} {format_number(-22*scale)} L 0 {format_number(14*scale)} L {format_number(-10*scale)} {format_number(-22*scale)} Z" fill="{suit.soft}" stroke="{suit.dark}" stroke-width="{format_number(stroke)}"/>
  <rect x="-{format_number(guard)}" y="{format_number(10*scale)}" width="{round(guard * 2)}" height="{round(9 * scale)}" rx="{round(3 * scale)}" fill="{suit.accent}" stroke="{suit.dark}" stroke-width="{format_number(stroke)}"/>
  <rect x="-{format_number(handle)}" y="{format_number(18*scale)}" width="{round(handle * 2)}" height="{round(30 * scale)}" rx="{round(4 * scale)}" fill="#d2a357" stroke="{suit.dark}" stroke-width="{format_number(stroke)}"/>
  <circle cy="{round(55 * scale)}" r="{round(8 * scale)}" fill="{suit.accent}" stroke="{suit.dark}" stroke-width="{format_number(stroke)}"/>
</g>'''


def baton_symbol(suit: Suit, x: float, y: float, scale: float = 1.0, rotate: float = 0) -> str:
    """Render a Bastos pip at the requested position."""

    stroke = max(2, 3 * scale)
    rx = -11 * scale
    ry = -58 * scale
    rw = 22 * scale
    rh = 116 * scale
    rrx = 10 * scale
    return f'''<g transform="translate({format_number(x)} {format_number(y)}) rotate({format_number(rotate)})">
  <rect x="{format_number(rx)}" y="{format_number(ry)}" width="{format_number(rw)}" height="{format_number(rh)}" rx="{format_number(rrx)}" fill="#8b6331" stroke="{suit.dark}" stroke-width="{format_number(stroke)}"/>
  <path d="M {format_number(rx)} {format_number(ry + 24*scale)} C {format_number(-34*scale)} {format_number(-26*scale)}, {format_number(-34*scale)} 0, {format_number(-10*scale)} {format_number(6*scale)}" fill="none" stroke="{suit.accent}" stroke-width="{format_number(stroke)}"/>
  <path d="M {format_number(-11*scale)} {format_number(28*scale)} C {format_number(36*scale)} {format_number(18*scale)}, {format_number(36*scale)} {format_number(-6*scale)}, {format_number(10*scale)} {format_number(-14*scale)}" fill="none" stroke="{suit.accent}" stroke-width="{format_number(stroke)}"/>
  <path d="M {format_number(-4*scale)} {format_number(-60*scale)} C {format_number(-22*scale)} {format_number(-82*scale)}, {format_number(-34*scale)} {format_number(-78*scale)}, {format_number(-28*scale)} {format_number(-50*scale)} C {format_number(-20*scale)} {format_number(-36*scale)}, {format_number(-8*scale)} {format_number(-44*scale)}, {format_number(-4*scale)} {format_number(-60*scale)} Z" fill="{suit.soft}" stroke="{suit.dark}" stroke-width="{format_number(stroke)}"/>
  <path d="M {format_number(4*scale)} {format_number(60*scale)} C {format_number(22*scale)} {format_number(82*scale)}, {format_number(34*scale)} {format_number(78*scale)}, {format_number(28*scale)} {format_number(50*scale)} C {format_number(20*scale)} {format_number(36*scale)}, {format_number(8*scale)} {format_number(44*scale)}, {format_number(4*scale)} {format_number(60*scale)} Z" fill="{suit.soft}" stroke="{suit.dark}" stroke-width="{format_number(stroke)}"/>
</g>'''


def suit_symbol(suit: Suit, x: float, y: float, scale: float = 1.0, rotate: float = 0) -> str:
    """Dispatch to the pip renderer for the given suit."""

    if suit.key == "oros":
        return coin_symbol(suit, x, y, scale, rotate)
    if suit.key == "copas":
        return cup_symbol(suit, x, y, scale, rotate)
    if suit.key == "espadas":
        return sword_symbol(suit, x, y, scale, rotate)
    if suit.key == "bastos":
        return baton_symbol(suit, x, y, scale, rotate)
    raise ValueError(f"Unknown suit: {suit.key}")


def corner_indices(suit: Suit, rank: Rank) -> str:
    """Render corner suit symbols (UL, LR - doubled size) and rank numbers (UR, LL, LL rotated 180°)."""

    # Upper-left suit symbol (doubled size: 0.68 * 2 = 1.36)
    suit_ul = suit_symbol(suit, 100, 140, 1.36, 0)

    # Lower-right suit symbol (doubled size, rotated 180, at bottom-right corner)
    suit_lr = f'''  <g transform="translate(750 1198) rotate(180)">
{suit_symbol(suit, 100, 140, 1.36, 0)}
  </g>'''

    # Face cards (Sota, Caballo, Rey) use 192px; number cards use 212px
    font_size = 192 if rank.face else 212
    rank_x_ur = 590 if rank.key == "sota" else (605 if rank.face else 620)
    rank_x_ll = 160 if rank.key == "sota" else (145 if rank.face else 130)

    # Upper-right rank number
    rank_ur = f'''  <text x="{rank_x_ur}" y="200" text-anchor="middle" font-size="{font_size}" font-family="Georgia, Times New Roman, serif" font-weight="700" fill="{suit.dark}">{rank.label}</text>'''

    # Lower-left rank number (rotated 180 degrees)
    rank_ll = f'''  <g transform="translate({rank_x_ll} 1000) rotate(180)">
    <text x="0" y="0" text-anchor="middle" font-size="{font_size}" font-family="Georgia, Times New Roman, serif" font-weight="700" fill="{suit.dark}">{rank.label}</text>
  </g>'''

    return f'''{suit_ul}
{suit_lr}
{rank_ur}
{rank_ll}'''


def corner_index(suit: Suit, rank: Rank, mirrored: bool = False) -> str:
    """Render the corner value and suit index for a card - large and readable."""

    transform = "translate(750 1200) rotate(180)" if mirrored else "translate(0 0)"
    symbol = suit_symbol(suit, 72, 106, 0.68, 0)
    return f'''  <g transform="{transform}">
    <text x="72" y="98" text-anchor="middle" font-size="96" font-family="Georgia, Times New Roman, serif" font-weight="700" fill="{suit.dark}">{rank.label}</text>
    {symbol}
  </g>'''


def pip_layout(count: int) -> list[dict[str, float]]:
    """Return pip coordinates for the numbered cards - simplified for small scale readability."""

    layouts: dict[int, list[dict[str, float]]] = {
        1: [{"X": 375, "Y": 600, "R": 0, "S": 1.2}],
        2: [
            {"X": 375, "Y": 380, "R": 0, "S": 2.0},
            {"X": 375, "Y": 820, "R": 180, "S": 2.0},
        ],
        3: [
            {"X": 375, "Y": 320, "R": 0, "S": 1.9},
            {"X": 375, "Y": 600, "R": 0, "S": 2.85},
            {"X": 375, "Y": 880, "R": 180, "S": 1.9},
        ],
        4: [
            {"X": 260, "Y": 340, "R": 0, "S": 1.8},
            {"X": 490, "Y": 340, "R": 0, "S": 1.8},
            {"X": 260, "Y": 860, "R": 180, "S": 1.8},
            {"X": 490, "Y": 860, "R": 180, "S": 1.8},
        ],
        5: [
            {"X": 260, "Y": 340, "R": 0, "S": 1.76},
            {"X": 490, "Y": 340, "R": 0, "S": 1.76},
            {"X": 375, "Y": 600, "R": 0, "S": 2.64},
            {"X": 260, "Y": 860, "R": 180, "S": 1.76},
            {"X": 490, "Y": 860, "R": 180, "S": 1.76},
        ],
        6: [
            {"X": 260, "Y": 300, "R": 0, "S": 1.72},
            {"X": 490, "Y": 300, "R": 0, "S": 1.72},
            {"X": 260, "Y": 600, "R": 0, "S": 1.72},
            {"X": 490, "Y": 600, "R": 0, "S": 1.72},
            {"X": 260, "Y": 900, "R": 180, "S": 1.72},
            {"X": 490, "Y": 900, "R": 180, "S": 1.72},
        ],
        7: [
            {"X": 375, "Y": 240, "R": 0, "S": 1.6},
            {"X": 260, "Y": 380, "R": 0, "S": 1.6},
            {"X": 490, "Y": 380, "R": 0, "S": 1.6},
            {"X": 260, "Y": 600, "R": 0, "S": 1.6},
            {"X": 490, "Y": 600, "R": 0, "S": 1.6},
            {"X": 260, "Y": 820, "R": 180, "S": 1.6},
            {"X": 490, "Y": 820, "R": 180, "S": 1.6},
        ],
    }
    try:
        return layouts[count]
    except KeyError as error:
        raise ValueError(f"No pip layout defined for {count}") from error


def number_body(suit: Suit, rank: Rank) -> str:
    """Build the interior artwork for a numbered card - simplified for readability."""

    layout = pip_layout(rank.value)
    # Special rotation overrides for center pip on rank 3 for bastos and espadas
    center_rotate = -45 if (rank.key == "3" and suit.key in ("bastos", "espadas")) else 0
    symbols = "\n".join(
        suit_symbol(suit, pip["X"], pip["Y"], pip["S"], pip["R"] + (center_rotate if pip["X"] == 375 and pip["Y"] == 600 else 0))
        for pip in layout
    )
    return symbols


def figure_top(suit: Suit, rank: Rank) -> str:
    """Build one mirrored half of a court-card illustration - simplified for small sizes."""

    if rank.key == "sota":
        title = "SOTA"
        crown = f'''    <path d="M -48 -124 L -24 -92 L 0 -114 L 24 -92 L 48 -124 M -40 -100 L 40 -100" fill="none" stroke="{suit.banner}" stroke-width="3" stroke-linecap="round"/>'''
    elif rank.key == "caballo":
        title = "CABALLO"
        crown = f'''    <path d="M -54 -118 L -18 -88 L 0 -108 L 18 -88 L 54 -118 M -44 -94 L 44 -94" fill="none" stroke="{suit.banner}" stroke-width="3" stroke-linecap="round"/>'''
    elif rank.key == "rey":
        title = "REY"
        crown = f'''    <path d="M -60 -120 L -30 -80 L 0 -110 L 30 -80 L 60 -120 M -50 -90 L 50 -90" fill="none" stroke="{suit.banner}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="-30" cy="-106" r="4" fill="{suit.accent}"/>
    <circle cx="0" cy="-115" r="4" fill="{suit.accent}"/>
    <circle cx="30" cy="-106" r="4" fill="{suit.accent}"/>'''
    else:
        raise ValueError(f"Unsupported face rank: {rank.key}")

    suit_badge = suit_symbol(suit, 0, 60, 0.7, 0)
    return f'''  <g transform="translate(375 380)">
    <circle cx="0" cy="-110" r="72" fill="#efdcc2" stroke="{suit.dark}" stroke-width="4"/>
    {crown}
    <path d="M -80 50 Q -60 120, 0 140 Q 60 120, 80 50 Z" fill="{suit.figure}" stroke="{suit.dark}" stroke-width="4"/>
    <path d="M -60 50 Q -40 100, 0 110 Q 40 100, 60 50 Z" fill="#f2dfbf" stroke="{suit.dark}" stroke-width="3"/>
    <path d="M -40 50 L -40 140 M 40 50 L 40 140" fill="none" stroke="{suit.dark}" stroke-width="3"/>
    <path d="M -76 145 H 76" fill="none" stroke="{suit.banner}" stroke-width="3"/>
    {suit_badge}
    <text x="0" y="190" text-anchor="middle" font-size="44" font-family="Georgia, Times New Roman, serif" font-weight="700" fill="{suit.banner}">{title}</text>
  </g>'''


def face_body(suit: Suit, rank: Rank) -> str:
    """Build the full mirrored body for a court card - simplified."""

    if rank.key == "rey":
        # Suit symbol at ~1/2 of the 480px emoji size, placed at lower-left of glyph, rotated -30°
        rey_suit = suit_symbol(suit, 190, 840, 2.6, -30)
        return f'''  <ellipse cx="{format_number(CENTER_X)}" cy="{format_number(CENTER_Y)}" rx="160" ry="240" fill="#fbf6ec" stroke="{suit.banner}" stroke-width="4"/>
  <text x="{format_number(CENTER_X)}" y="660" text-anchor="middle" dominant-baseline="middle" font-size="480">&#x1FAC5;&#x1F3FB;</text>
  {rey_suit}
  <rect x="200" y="230" width="350" height="110" rx="12" fill="{suit.dark}" opacity="0.72"/>
  <text x="{format_number(CENTER_X)}" y="300" text-anchor="middle" dominant-baseline="middle" font-size="88" font-family="Georgia, Times New Roman, serif" font-weight="700" fill="#f8eed6" letter-spacing="8">REY</text>'''

    if rank.key == "caballo":
        caballo_suit = suit_symbol(suit, 190, 840, 2.6, -30)
        return f'''  <ellipse cx="{format_number(CENTER_X)}" cy="{format_number(CENTER_Y)}" rx="160" ry="240" fill="#fbf6ec" stroke="{suit.banner}" stroke-width="4"/>
  <text x="{format_number(CENTER_X)}" y="660" text-anchor="middle" dominant-baseline="middle" font-size="480">&#x1F3C7;</text>
  {caballo_suit}
  <rect x="165" y="230" width="420" height="105" rx="12" fill="{suit.dark}" opacity="0.72"/>
  <text x="{format_number(CENTER_X)}" y="300" text-anchor="middle" dominant-baseline="middle" font-size="72" font-family="Georgia, Times New Roman, serif" font-weight="700" fill="#f8eed6" letter-spacing="6">CABALLO</text>'''

    if rank.key == "sota":
        sota_suit = suit_symbol(suit, 190, 840, 2.6, -30)
        return f'''  <ellipse cx="{format_number(CENTER_X)}" cy="{format_number(CENTER_Y)}" rx="160" ry="240" fill="#fbf6ec" stroke="{suit.banner}" stroke-width="4"/>
  <text x="{format_number(CENTER_X)}" y="660" text-anchor="middle" dominant-baseline="middle" font-size="480">&#x1F472;</text>
  {sota_suit}
  <rect x="200" y="230" width="350" height="110" rx="12" fill="{suit.dark}" opacity="0.72"/>
  <text x="{format_number(CENTER_X)}" y="300" text-anchor="middle" dominant-baseline="middle" font-size="88" font-family="Georgia, Times New Roman, serif" font-weight="700" fill="#f8eed6" letter-spacing="8">SOTA</text>'''

    top = figure_top(suit, rank)
    return f'''  <ellipse cx="{format_number(CENTER_X)}" cy="{format_number(CENTER_Y)}" rx="160" ry="240" fill="#fbf6ec" stroke="{suit.banner}" stroke-width="4"/>
  <path d="M188 600 H562" fill="none" stroke="{suit.banner}" stroke-width="3"/>
  {top}
  <g transform="translate(0 1200) scale(1 -1)">
    {top}
  </g>'''


def ace_body(suit: Suit) -> str:
    """Build the body for an Ace, showing a large centered suit symbol - simplified."""

    large_symbol = suit_symbol(suit, CENTER_X, CENTER_Y, 3.8, 0)
    return f'''  <ellipse cx="{format_number(CENTER_X)}" cy="{format_number(CENTER_Y)}" rx="160" ry="240" fill="#fbf6ec" stroke="{suit.banner}" stroke-width="4"/>
  {large_symbol}'''


def card_svg(suit: Suit, rank: Rank) -> str:
    """Assemble a complete SVG document for one card face."""

    title = f"{rank.name} de {suit.name}"
    body = "\n".join(
        (
            card_frame(suit),
            corner_indices(suit, rank),
            ace_body(suit) if rank.key == "as" else (face_body(suit, rank) if rank.face else number_body(suit, rank)),
        )
    )
    return svg_document(body, title)


def back_svg(title: str) -> str:
    """Build the shared card-back SVG document - simplified for readability."""

    body = '''  <rect x="18" y="18" width="714" height="1164" rx="34" fill="#efe4c8" stroke="#1f1b16" stroke-width="5" filter="url(#shadow)"/>
  <rect x="42" y="42" width="666" height="1116" rx="28" fill="#6f1f23" stroke="#ecd5a4" stroke-width="4"/>
  <rect x="68" y="68" width="614" height="1064" rx="22" fill="none" stroke="#f8eed6" stroke-width="2"/>
  <text x="375" y="280" text-anchor="middle" font-size="104" font-family="Georgia, Times New Roman, serif" letter-spacing="8" fill="#f8eed6" font-weight="700">BARAJA</text>
  <circle cx="375" cy="600" r="200" fill="none" stroke="#ecd5a4" stroke-width="6"/>
  <circle cx="375" cy="600" r="160" fill="none" stroke="#f8eed6" stroke-width="3" stroke-dasharray="12 14"/>
  <path d="M375 384 L425 524 L550 524 L450 594 L500 734 L375 664 L250 734 L300 594 L200 524 L325 524 Z" fill="#ecd5a4" stroke="#f8eed6" stroke-width="5"/>
  <text x="375" y="950" text-anchor="middle" font-size="92" font-family="Georgia, Times New Roman, serif" letter-spacing="6" fill="#f8eed6">ESPAÑOLA</text>'''
    return svg_document(body, title)


def contact_sheet_item(index: int, suit: Suit, rank: Rank) -> str:
    """Build one positioned thumbnail entry for the contact sheet."""

    column = index % SHEET_COLUMNS
    row = index // SHEET_COLUMNS
    x = SHEET_MARGIN_X + (column * (SHEET_THUMB_WIDTH + SHEET_GAP_X))
    y = SHEET_MARGIN_Y + (row * (SHEET_THUMB_HEIGHT + SHEET_GAP_Y))
    href = f"{suit.file}_{rank.key}.svg"
    label = f"{rank.name} de {suit.name}"
    return f'''  <g transform="translate({x} {y})">
    <image href="{href}" x="0" y="0" width="{SHEET_THUMB_WIDTH}" height="{SHEET_THUMB_HEIGHT}"/>
    <text x="{round(SHEET_THUMB_WIDTH / 2)}" y="{round(SHEET_THUMB_HEIGHT + 20)}" text-anchor="middle" font-size="14" font-family="Georgia, Times New Roman, serif" fill="#3b3025">{label}</text>
  </g>'''


def contact_sheet(suits: tuple[Suit, ...], ranks: tuple[Rank, ...]) -> str:
    """Build a preview sheet that embeds all generated card faces."""

    cards = [(suit, rank) for suit in suits for rank in ranks]
    items = [
        contact_sheet_item(index, suit, rank)
        for index, (suit, rank) in enumerate(cards)
    ]

    # Add card back centered at the bottom
    back_x = round((SHEET_WIDTH - SHEET_THUMB_WIDTH) / 2)
    back_y = SHEET_MARGIN_Y + (len(cards) // SHEET_COLUMNS) * (SHEET_THUMB_HEIGHT + SHEET_GAP_Y) + SHEET_GAP_Y
    back_item = f'''  <g transform="translate({back_x} {back_y})">
    <image href="baraja_espanola_back.svg" x="0" y="0" width="{SHEET_THUMB_WIDTH}" height="{SHEET_THUMB_HEIGHT}"/>
    <text x="{round(SHEET_THUMB_WIDTH / 2)}" y="{round(SHEET_THUMB_HEIGHT + 20)}" text-anchor="middle" font-size="14" font-family="Georgia, Times New Roman, serif" fill="#3b3025">Card Back</text>
  </g>'''
    items.append(back_item)

    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{SHEET_WIDTH}" height="{SHEET_HEIGHT}" viewBox="0 0 {SHEET_WIDTH} {SHEET_HEIGHT}">
    <rect width="{SHEET_WIDTH}" height="{SHEET_HEIGHT}" fill="#f6efdf"/>
    <text x="{round(SHEET_WIDTH / 2)}" y="52" text-anchor="middle" font-size="32" font-family="Georgia, Times New Roman, serif" letter-spacing="4" fill="#4e3723">BARAJA ESPANOLA</text>
    <text x="{round(SHEET_WIDTH / 2)}" y="82" text-anchor="middle" font-size="15" font-family="Georgia, Times New Roman, serif" fill="#715740">Traditional-style 40-card SVG deck preview</text>
{"\n".join(items)}
</svg>
'''


def write_text(path: Path, content: str) -> None:
    """Write UTF-8 text content to disk."""

    path.write_text(content, encoding="utf-8")


def generate(output_dir: Path) -> None:
    """Generate the full deck, back, and contact sheet into one folder."""

    output_dir.mkdir(parents=True, exist_ok=True)

    for suit in SUITS:
        for rank in RANKS:
            path = output_dir / f"{suit.file}_{rank.key}.svg"
            write_text(path, card_svg(suit, rank))

    write_text(output_dir / "baraja_espanola_back.svg", back_svg("Baraja Espanola Card Back"))
    write_text(output_dir / "baraja_espanola_sheet.svg", contact_sheet(SUITS, RANKS))


def parse_args() -> argparse.Namespace:
    """Parse the CLI arguments for the deck generator."""

    parser = argparse.ArgumentParser(
        description="Generate a traditional-style 40-card Baraja Espanola SVG deck."
    )
    parser.add_argument(
        "output_dir",
        nargs="?",
        default=Path(__file__).resolve().parent,
        type=Path,
        help="Directory to write the generated SVG files into.",
    )
    return parser.parse_args()


def main() -> None:
    """Run the command-line generator."""

    args = parse_args()
    generate(args.output_dir)


if __name__ == "__main__":
    main()
