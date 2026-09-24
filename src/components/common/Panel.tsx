import { Box, Paper, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

/**
 * A bordered content region with an optional header.
 *
 * This is the application's only "card". It has a hairline border and no
 * shadow, and its header row is a fixed height so that panels sitting side by
 * side line up along their content edge rather than only their top edge.
 */
export interface PanelProps {
  title?: string;
  action?: ReactNode;
  /** Removes the body padding, for panels whose child is a table or a list. */
  flush?: boolean;
  children: ReactNode;
}

export function Panel({ title, action, flush = false, children }: PanelProps) {
  return (
    <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
      {title && (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            px: 1.5, minHeight: 40, flexShrink: 0,
            borderBottom: 1, borderColor: 'line.subtle',
            bgcolor: 'surfaceTone.sunken',
          }}
        >
          <Typography variant="overline" color="ink.muted" component="h2">
            {title}
          </Typography>
          {action}
        </Stack>
      )}
      <Box sx={{ minHeight: 0, flex: 1, overflow: 'auto', ...(flush ? null : { p: 1.5 }) }}>{children}</Box>
    </Paper>
  );
}
