import { Chip, type ChipProps, type SxProps, type Theme } from '@mui/material';
import type { StatusTone } from '@/config/availability';

/**
 * The one way a status is rendered anywhere in the application.
 *
 * Tone maps to a colour pair from the theme, and the label is ALWAYS present —
 * colour is never the only signal, which matters both for accessibility and for
 * the greyscale printouts these screens sometimes end up in.
 */
export interface StatusChipProps extends Omit<ChipProps, 'color' | 'label' | 'variant'> {
  label: string;
  tone: StatusTone;
}

export function StatusChip({ label, tone, sx, ...rest }: StatusChipProps) {
  return (
    <Chip
      label={label}
      // MUI merges an `sx` array left to right, so a caller's overrides win
      // over the tone styling without either side needing to know the other.
      sx={
        [
          (theme: Theme) => ({
            color: theme.palette.statusTone[tone],
            backgroundColor: theme.palette.statusTone[`${tone}Subtle` as const],
            border: `1px solid ${theme.palette.statusTone[tone]}26`,
          }),
          ...(Array.isArray(sx) ? (sx as unknown[]) : [sx]),
        ] as SxProps<Theme>
      }
      {...rest}
    />
  );
}
