/**
 * Design tokens — raw values, no Material UI dependency.
 *
 * ── Direction ──────────────────────────────────────────────────────────────
 * This is an internal tool an administrator keeps open all day, so it is tuned
 * for reading density and sustained use, not for first impressions. It shares
 * the storefront's cool, blued-steel identity so the two products feel like one
 * business, but it is a denser, flatter, more utilitarian relative: smaller
 * type, tighter rows, hairline borders instead of shadows, and colour reserved
 * almost entirely for status.
 *
 * Elevation is expressed with borders and surface tone. There are no drop
 * shadows outside genuinely floating layers (menus, dialogs), because a page of
 * shadowed cards is the single strongest "generated dashboard" tell.
 * ───────────────────────────────────────────────────────────────────────────
 */

export const colors = {
  /** Application ground — the area behind panels. */
  canvas: '#EEF1F3',
  /** Panels, tables, cards. */
  surface: '#FFFFFF',
  /** Table headers, toolbars, selected rows, inset regions. */
  surfaceSunken: '#F4F6F7',
  /** Sidebar and any other permanently dark chrome. */
  surfaceInverse: '#141D26',
  surfaceInverseRaised: '#1E2A36',

  /** Primary text. A blue-black with real hue, never `#111`. */
  ink: '#16202A',
  /** Secondary text, table cell support text. */
  inkSecondary: '#4E5A66',
  /** Column headers, metadata, timestamps. Meets 4.5:1 on every light surface. */
  inkMuted: '#646F7A',
  inkInverse: '#E9EDF0',
  inkInverseMuted: '#94A1AC',

  /** Blued steel — selection, focus, links, the active nav item. */
  accent: '#24446B',
  accentHover: '#1B3453',
  accentSubtle: '#E2E9F1',

  /** Hairlines. The primary means of separating regions. */
  line: '#D8DDE1',
  lineStrong: '#B7C0C7',
  lineInverse: '#2C3845',

  /**
   * Status colours. Each is always paired with a text label so colour is never
   * the only signal — required for availability and inquiry state.
   */
  positive: '#2F6146',
  positiveSubtle: '#E3EFE8',
  notice: '#7A5A1E',
  noticeSubtle: '#F6EEDC',
  danger: '#9A2B24',
  dangerSubtle: '#F7E5E3',
  info: '#24446B',
  infoSubtle: '#E2E9F1',
  neutral: '#5C666F',
  neutralSubtle: '#EBEEF0',
} as const;

/**
 * 8px base. MUI's `spacing(n)` multiplies this, so `spacing(1)` is 8px and
 * `spacing(0.5)` is 4px — the two values most of the UI is built from.
 */
export const spacingUnit = 8;

/**
 * Type scale. Deliberately smaller than the storefront's: 13px is the working
 * body size for tables and forms, and 14px is reserved for prose.
 */
export const fontSize = {
  micro: 11,
  caption: 12,
  body: 13,
  bodyLarge: 14,
  title: 16,
  headingSm: 18,
  heading: 22,
} as const;

export const fontWeight = { regular: 400, medium: 500, semibold: 600 } as const;

/**
 * One radius for interactive controls and one for surfaces. Two values, applied
 * consistently, read as intentional; five values read as accidental.
 */
export const radius = { control: 4, surface: 6 } as const;

/**
 * The only shadows in the application, for genuinely floating layers. Anything
 * that sits in the page flow uses a border instead.
 */
export const shadow = {
  menu: '0 4px 16px rgba(20, 29, 38, 0.12), 0 1px 3px rgba(20, 29, 38, 0.08)',
  dialog: '0 16px 48px rgba(20, 29, 38, 0.18)',
} as const;

/**
 * Motion. The app has no gesture-driven or physics-based interaction — every
 * transition here is a deterministic, hand-timed CSS move, not a spring — so
 * these are just the two curves and three speeds everything should draw from,
 * instead of each component inventing its own `ease` and guessing a duration.
 * Same values as the storefront's `theme/tokens.ts`, so the two apps share one
 * motion vocabulary even though their component libraries differ.
 */
export const duration = {
  /** Hover/press state changes. */
  fast: 100,
  /** Sidebar collapse, menu and tooltip reveals. */
  standard: 140,
  /** Dialogs — a bigger surface arriving. */
  slow: 220,
} as const;

export const easing = {
  /** Arriving — decelerate. */
  enter: 'cubic-bezier(0.16, 1, 0.3, 1)',
  /** Leaving — accelerate. */
  exit: 'cubic-bezier(0.4, 0, 1, 1)',
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
} as const;

/** Fixed chrome dimensions, shared by the layout and the components that offset against it. */
export const layout = {
  sidebarWidth: 236,
  sidebarCollapsedWidth: 60,
  topBarHeight: 52,
  /** Reading measure for forms and detail panes. Tables are exempt. */
  contentMaxWidth: 1360,
} as const;

/**
 * Focus ring. Defined once and reused, because a consistent focus treatment is
 * the difference between a keyboard-usable app and one that merely passes an
 * automated check.
 */
export const focusRing = `0 0 0 2px ${colors.surface}, 0 0 0 4px ${colors.accent}`;
