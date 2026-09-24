import type { PaletteOptions } from '@mui/material/styles';
import { colors } from './tokens';

/**
 * Semantic palette entries beyond Material's defaults.
 *
 * Components reference names — `palette.ink.muted`, `palette.statusTone.positive`
 * — and never a raw hex. Rebranding means editing `tokens.ts` alone.
 */
declare module '@mui/material/styles' {
  interface Palette {
    ink: { primary: string; secondary: string; muted: string; inverse: string; inverseMuted: string };
    line: { subtle: string; strong: string; inverse: string };
    surfaceTone: { canvas: string; raised: string; sunken: string; inverse: string; inverseRaised: string };
    statusTone: {
      positive: string; positiveSubtle: string;
      notice: string; noticeSubtle: string;
      danger: string; dangerSubtle: string;
      info: string; infoSubtle: string;
      neutral: string; neutralSubtle: string;
    };
  }
  interface PaletteOptions {
    ink?: Palette['ink'];
    line?: Palette['line'];
    surfaceTone?: Palette['surfaceTone'];
    statusTone?: Palette['statusTone'];
  }
}

export const palette: PaletteOptions = {
  mode: 'light',

  /**
   * Primary is the ink, not the accent: buttons read as printed black, and
   * blued steel stays reserved for selection, focus and links so it keeps
   * meaning something.
   */
  primary: { main: colors.ink, dark: '#0C141C', light: colors.inkSecondary, contrastText: '#FFFFFF' },
  secondary: { main: colors.accent, dark: colors.accentHover, light: colors.accentSubtle, contrastText: '#FFFFFF' },
  error: { main: colors.danger, light: colors.dangerSubtle, contrastText: '#FFFFFF' },
  warning: { main: colors.notice, light: colors.noticeSubtle, contrastText: '#FFFFFF' },
  success: { main: colors.positive, light: colors.positiveSubtle, contrastText: '#FFFFFF' },
  info: { main: colors.info, light: colors.infoSubtle, contrastText: '#FFFFFF' },

  background: { default: colors.canvas, paper: colors.surface },
  text: { primary: colors.ink, secondary: colors.inkSecondary, disabled: colors.inkMuted },
  divider: colors.line,

  ink: {
    primary: colors.ink,
    secondary: colors.inkSecondary,
    muted: colors.inkMuted,
    inverse: colors.inkInverse,
    inverseMuted: colors.inkInverseMuted,
  },
  line: { subtle: colors.line, strong: colors.lineStrong, inverse: colors.lineInverse },
  surfaceTone: {
    canvas: colors.canvas,
    raised: colors.surface,
    sunken: colors.surfaceSunken,
    inverse: colors.surfaceInverse,
    inverseRaised: colors.surfaceInverseRaised,
  },
  statusTone: {
    positive: colors.positive, positiveSubtle: colors.positiveSubtle,
    notice: colors.notice, noticeSubtle: colors.noticeSubtle,
    danger: colors.danger, dangerSubtle: colors.dangerSubtle,
    info: colors.info, infoSubtle: colors.infoSubtle,
    neutral: colors.neutral, neutralSubtle: colors.neutralSubtle,
  },
};
