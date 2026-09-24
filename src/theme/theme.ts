import { createTheme, type Shadows } from '@mui/material/styles';
import { components } from './components';
import { palette } from './palette';
import { radius, spacingUnit } from './tokens';
import { typography } from './typography';

/**
 * The single theme instance.
 *
 * `shadows` is flattened to `none` at every level so that a stray `elevation`
 * prop cannot reintroduce the shadowed-card look the design deliberately avoids.
 * The two real shadows — menus and dialogs — are applied by name in
 * `components.ts` from `tokens.shadow`.
 */
export const theme = createTheme({
  palette,
  typography,
  components,
  spacing: spacingUnit,
  shape: { borderRadius: radius.surface },
  shadows: Array.from({ length: 25 }, () => 'none') as unknown as Shadows,
});
