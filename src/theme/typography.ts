import type { ThemeOptions } from '@mui/material/styles';

type TypographyOptions = Extract<ThemeOptions['typography'], object>;
import { fontSize, fontWeight } from './tokens';

/**
 * The system UI stack. A downloaded webfont would cost a flash of unstyled text
 * on every window open for no benefit in an internal tool — the native face is
 * the one the administrator's OS already renders best at 13px.
 */
const fontFamily = [
  '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto',
  '"Helvetica Neue"', 'Arial', 'sans-serif',
].join(', ');

/** Tabular figures, so prices and counts align down a column. */
export const numericFontFeatures = { fontVariantNumeric: 'tabular-nums' } as const;

const px = (value: number) => `${value / 16}rem`;

export const typography: TypographyOptions = {
  fontFamily,
  fontSize: fontSize.body,
  htmlFontSize: 16,

  // Page title. There is exactly one per screen, in the top bar.
  h1: { fontFamily, fontSize: px(fontSize.heading), fontWeight: fontWeight.semibold, lineHeight: 1.25, letterSpacing: '-0.01em' },
  // Section heading inside a page.
  h2: { fontFamily, fontSize: px(fontSize.headingSm), fontWeight: fontWeight.semibold, lineHeight: 1.3, letterSpacing: '-0.005em' },
  // Panel heading.
  h3: { fontFamily, fontSize: px(fontSize.title), fontWeight: fontWeight.semibold, lineHeight: 1.35 },
  h4: { fontFamily, fontSize: px(fontSize.bodyLarge), fontWeight: fontWeight.semibold, lineHeight: 1.4 },
  h5: { fontFamily, fontSize: px(fontSize.body), fontWeight: fontWeight.semibold, lineHeight: 1.4 },
  h6: { fontFamily, fontSize: px(fontSize.body), fontWeight: fontWeight.semibold, lineHeight: 1.4 },

  body1: { fontFamily, fontSize: px(fontSize.body), lineHeight: 1.55 },
  body2: { fontFamily, fontSize: px(fontSize.caption), lineHeight: 1.5 },
  subtitle1: { fontFamily, fontSize: px(fontSize.bodyLarge), fontWeight: fontWeight.medium, lineHeight: 1.45 },
  subtitle2: { fontFamily, fontSize: px(fontSize.body), fontWeight: fontWeight.medium, lineHeight: 1.45 },
  caption: { fontFamily, fontSize: px(fontSize.caption), lineHeight: 1.45 },

  /**
   * Repurposed as the column-header / eyebrow style: uppercase, tracked, tiny.
   * Used for table headers and field-group labels.
   */
  overline: {
    fontFamily,
    fontSize: px(fontSize.micro),
    fontWeight: fontWeight.semibold,
    lineHeight: 1.4,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
  },

  button: { fontFamily, fontSize: px(fontSize.body), fontWeight: fontWeight.medium, textTransform: 'none', letterSpacing: 0 },
};
