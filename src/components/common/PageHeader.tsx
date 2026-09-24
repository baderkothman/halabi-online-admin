import { Box, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

/**
 * The heading block at the top of a page body.
 *
 * The page TITLE lives in the top bar, not here — repeating it would waste the
 * most valuable vertical space on the screen. This carries the supporting count
 * or description and the page's primary actions.
 */
export interface PageHeaderProps {
  /** A short operational line: "34 pieces · 12 published". */
  summary?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}

export function PageHeader({ summary, actions, children }: PageHeaderProps) {
  return (
    <Box sx={{ mb: 2 }}>
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{ flexWrap: 'wrap', rowGap: 1 }}
      >
        {typeof summary === 'string' ? (
          <Typography variant="body2" color="ink.muted">
            {summary}
          </Typography>
        ) : (
          summary
        )}
        {actions && (
          <Stack direction="row" spacing={1} sx={{ ml: 'auto' }}>
            {actions}
          </Stack>
        )}
      </Stack>
      {children}
    </Box>
  );
}
