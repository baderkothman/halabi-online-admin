import type { Components, Theme } from '@mui/material/styles';
import { colors, focusRing, radius, shadow } from './tokens';
import { numericFontFeatures } from './typography';

/**
 * Component defaults.
 *
 * Every rule here exists so that feature code can use plain MUI components and
 * still get the right density, borders and focus treatment. If a screen needs a
 * one-off `sx` to look correct, the default below is wrong and should change.
 */
export const components: Components<Theme> = {
  MuiCssBaseline: {
    styleOverrides: {
      // A desktop shell manages its own scroll regions; a scrolling document
      // behind a fixed sidebar produces two scrollbars and a drifting header.
      'html, body, #root': { height: '100%', overflow: 'hidden' },
      body: { backgroundColor: colors.canvas, WebkitFontSmoothing: 'antialiased' },
      // Native drag-select of UI chrome looks broken in a desktop window, but
      // data must stay selectable, so this is opt-out rather than global.
      '::selection': { backgroundColor: colors.accentSubtle },
      // A single scrollbar treatment everywhere, instead of the OS overlay in
      // some panes and the default grey bar in others.
      '*::-webkit-scrollbar': { width: 10, height: 10 },
      '*::-webkit-scrollbar-thumb': {
        backgroundColor: colors.lineStrong,
        borderRadius: 8,
        border: `2px solid ${colors.canvas}`,
      },
      '*::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
    },
  },

  MuiButton: {
    defaultProps: { disableElevation: true, size: 'small' },
    styleOverrides: {
      root: {
        borderRadius: radius.control,
        paddingInline: 12,
        minHeight: 32,
        '&:focus-visible': { boxShadow: focusRing, outline: 'none' },
      },
      sizeSmall: { minHeight: 30, paddingInline: 10 },
      sizeLarge: { minHeight: 40, paddingInline: 18 },
      outlined: { borderColor: colors.lineStrong, '&:hover': { borderColor: colors.ink, backgroundColor: colors.surfaceSunken } },
      text: { '&:hover': { backgroundColor: colors.surfaceSunken } },
    },
  },

  MuiIconButton: {
    defaultProps: { size: 'small' },
    styleOverrides: {
      root: {
        borderRadius: radius.control,
        color: colors.inkSecondary,
        '&:hover': { backgroundColor: colors.surfaceSunken, color: colors.ink },
        '&:focus-visible': { boxShadow: focusRing, outline: 'none' },
      },
    },
  },

  MuiPaper: {
    defaultProps: { elevation: 0 },
    styleOverrides: {
      root: { backgroundImage: 'none' },
      // Only the floating variants get a shadow; see tokens.ts.
      outlined: { borderColor: colors.line, borderRadius: radius.surface },
    },
  },

  MuiCard: {
    defaultProps: { variant: 'outlined' },
    styleOverrides: { root: { borderRadius: radius.surface, borderColor: colors.line } },
  },

  MuiMenu: {
    defaultProps: { elevation: 0 },
    styleOverrides: {
      paper: { border: `1px solid ${colors.line}`, borderRadius: radius.surface, boxShadow: shadow.menu, minWidth: 180 },
      list: { paddingBlock: 4 },
    },
  },
  MuiMenuItem: {
    styleOverrides: {
      root: {
        fontSize: '0.8125rem',
        minHeight: 32,
        '&:focus-visible': { backgroundColor: colors.surfaceSunken, outline: 'none' },
      },
    },
  },

  MuiDialog: {
    styleOverrides: {
      paper: { border: `1px solid ${colors.line}`, borderRadius: radius.surface, boxShadow: shadow.dialog },
    },
  },
  MuiDialogTitle: { styleOverrides: { root: { fontSize: '1rem', fontWeight: 600, padding: '16px 20px 8px' } } },
  MuiDialogContent: { styleOverrides: { root: { padding: '0 20px 16px' } } },
  MuiDialogActions: { styleOverrides: { root: { padding: '12px 20px', borderTop: `1px solid ${colors.line}`, gap: 8 } } },

  MuiTooltip: {
    defaultProps: { arrow: false, enterDelay: 400 },
    styleOverrides: {
      tooltip: { backgroundColor: colors.surfaceInverse, fontSize: '0.75rem', padding: '5px 8px', borderRadius: radius.control },
    },
  },

  MuiTextField: { defaultProps: { size: 'small', variant: 'outlined', fullWidth: true } },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: radius.control,
        backgroundColor: colors.surface,
        fontSize: '0.8125rem',
        '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.line },
        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.lineStrong },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderWidth: 1, borderColor: colors.accent },
        // The theme's focus ring, applied to the field rather than the outline,
        // so it is visible against both surface and sunken backgrounds.
        '&.Mui-focused': { boxShadow: `0 0 0 3px ${colors.accentSubtle}` },
      },
      input: { paddingBlock: 7, ...numericFontFeatures },
    },
  },
  MuiInputLabel: { styleOverrides: { root: { fontSize: '0.8125rem' } } },
  MuiFormHelperText: { styleOverrides: { root: { fontSize: '0.75rem', marginInline: 0, marginTop: 4 } } },
  MuiFormLabel: { styleOverrides: { asterisk: { color: colors.danger } } },

  MuiSelect: { defaultProps: { size: 'small' } },
  MuiCheckbox: { defaultProps: { size: 'small' }, styleOverrides: { root: { '&:focus-visible': { boxShadow: focusRing } } } },
  MuiSwitch: { defaultProps: { size: 'small' } },

  MuiTable: { defaultProps: { size: 'small' } },
  MuiTableCell: {
    styleOverrides: {
      root: {
        borderBottomColor: colors.line,
        padding: '8px 12px',
        fontSize: '0.8125rem',
        ...numericFontFeatures,
      },
      head: {
        backgroundColor: colors.surfaceSunken,
        color: colors.inkMuted,
        fontSize: '0.6875rem',
        fontWeight: 600,
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        // Long tables scroll inside their own container; the header stays put.
        position: 'sticky',
        top: 0,
        zIndex: 2,
      },
    },
  },
  MuiTableRow: {
    styleOverrides: {
      root: {
        '&:hover': { backgroundColor: colors.surfaceSunken },
        '&:last-of-type td': { borderBottom: 'none' },
      },
    },
  },
  MuiTableSortLabel: {
    styleOverrides: {
      root: { '&.Mui-active': { color: colors.ink }, '&:focus-visible': { boxShadow: focusRing, outline: 'none' } },
    },
  },
  MuiTablePagination: {
    styleOverrides: {
      root: { borderTop: `1px solid ${colors.line}`, fontSize: '0.75rem' },
      selectLabel: { fontSize: '0.75rem' },
      displayedRows: { fontSize: '0.75rem', ...numericFontFeatures },
    },
  },

  MuiChip: {
    defaultProps: { size: 'small' },
    styleOverrides: {
      root: { borderRadius: radius.control, fontSize: '0.6875rem', fontWeight: 600, height: 20 },
      label: { paddingInline: 6, letterSpacing: '0.02em' },
    },
  },

  MuiAlert: {
    defaultProps: { variant: 'outlined' },
    styleOverrides: { root: { borderRadius: radius.surface, fontSize: '0.8125rem', alignItems: 'center' } },
  },

  MuiTabs: {
    styleOverrides: {
      root: { minHeight: 36, borderBottom: `1px solid ${colors.line}` },
      indicator: { height: 2, backgroundColor: colors.ink },
    },
  },
  MuiTab: {
    styleOverrides: {
      root: {
        minHeight: 36,
        padding: '0 12px',
        fontSize: '0.8125rem',
        textTransform: 'none',
        '&:focus-visible': { boxShadow: focusRing, outline: 'none' },
      },
    },
  },

  MuiLink: {
    defaultProps: { underline: 'hover' },
    styleOverrides: {
      root: { color: colors.accent, '&:focus-visible': { boxShadow: focusRing, outline: 'none', borderRadius: 2 } },
    },
  },

  MuiListItemButton: {
    styleOverrides: {
      root: { borderRadius: radius.control, '&:focus-visible': { boxShadow: focusRing, outline: 'none' } },
    },
  },
  MuiDivider: { styleOverrides: { root: { borderColor: colors.line } } },
  MuiSkeleton: { defaultProps: { animation: 'wave' }, styleOverrides: { root: { backgroundColor: colors.surfaceSunken } } },
  MuiLinearProgress: { styleOverrides: { root: { height: 2, backgroundColor: colors.accentSubtle } } },
};
