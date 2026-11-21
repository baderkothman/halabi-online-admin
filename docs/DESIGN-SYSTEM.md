# Design system

## Direction

This is a tool an administrator keeps open all day. It shares the storefront's
cool, blued-steel identity so the two products read as one business, but it is a
denser, flatter, more utilitarian relative: smaller type, tighter rows, hairline
borders instead of shadows, and colour reserved almost entirely for status.

Elevation is expressed with borders and surface tone. `shadows` is flattened to
`none` at all 25 Material levels in `theme.ts`, so a stray `elevation` prop
cannot reintroduce the shadowed-card look. The only two real shadows — menus and
dialogs — are applied by name from `tokens.shadow`.

## Where things live

```
theme/
├── tokens.ts       raw values — no Material UI dependency
├── palette.ts      semantic names: ink.muted, statusTone.positive
├── typography.ts   the type scale
├── components.ts   component defaults
└── theme.ts        the single theme instance
```

Nothing outside `theme/` contains a hex value. Components reference semantic
names, so rebranding is an edit to `tokens.ts` alone.

## Scale

**Type.** 13px is the working body size for tables and forms; 14px is for prose.
`overline` is repurposed as the column-header and eyebrow style — uppercase,
tracked, 11px. Numerals are tabular everywhere a figure appears in a column.

**Space.** An 8px base. `spacing(1)` is 8px and `spacing(0.5)` is 4px, which is
most of the UI.

**Radius.** Two values: 4px for controls, 6px for surfaces. Two applied
consistently read as intentional; five read as accidental.

**Chrome.** 52px top bar, 236px sidebar (60px collapsed), 1360px content measure
for forms and detail panes. Tables are exempt from the measure — their content
needs the width.

## Colour

The ground is a cool silver-grey, the ink a blue-black with real hue. The single
chromatic accent is blued steel (`#24446B`) — the colour heat-treated steel
turns — reserved for selection, focus and links. Buttons are ink, not accent, so
the accent keeps meaning something.

Status colours are muted and always paired with a text label. Colour is never
the only signal: the selected inbox row carries a left rule as well as a tint,
and availability always renders its label.

## Status vocabulary

`StatusChip` is the one way a status is rendered. It takes a `tone`, and the
tone maps to a colour pair in the palette. The tone itself comes from
`config/availability.ts` or `config/inquiry-status.ts` — never from the
component, and never from a literal in a feature file.

## Density

Table rows are 8px/12px cells at 13px type — roughly 33px per row, which puts
about 25 pieces on a laptop screen without scrolling. Table headers are sticky,
so scrolling a long catalogue never loses the column labels.

The application is designed for 1024px and wider, and tested at 100%, 125% and
150% OS scaling. The window's minimum is 1024×680.

## What is deliberately not here

No gradients, glassmorphism, neon, oversized KPI tiles, decorative charts, or
animation beyond a 140ms sidebar transition. The dashboard's four figures are
set at 26px — the only display-size type in the product — and everything else
stays quiet. The fastest way to make an internal tool look generated is to
decorate it.

Charts are allowed only when they show real records. The dashboard's 30-day
inquiry chart (`components/data-display/BarChart.tsx`) is built from boxes
rather than a charting library: muted ink bars, today in the accent, exact
values in a tooltip and in a visually hidden table. Pipeline bars are 4px
tracks with the count printed beside them, so nothing depends on reading a bar
length.

Watch cards in the grid view follow the same rules as the rest of the app: an
outlined surface with no shadow, the photo first at 4:3 on a sunken ground, and
status shown by the shared `StatusChip`.
