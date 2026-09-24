import { Box, Button, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

/**
 * Shown when a request succeeded and returned nothing.
 *
 * Distinct from an error on purpose: "no results" is a normal outcome and
 * should read calmly. An action is offered whenever there is a sensible next
 * move — clearing a filter, creating the first record — because a dead end with
 * no way forward is the most common failing of an empty state.
 */
export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', px: 3, py: 7 }}>
      <Stack spacing={1} alignItems="center" sx={{ maxWidth: 360, textAlign: 'center' }}>
        {icon && <Box sx={{ color: 'ink.muted', display: 'flex', mb: 0.5 }}>{icon}</Box>}
        <Typography variant="subtitle2">{title}</Typography>
        {description && (
          <Typography variant="body2" color="ink.muted">
            {description}
          </Typography>
        )}
        {action && (
          <Button size="small" variant="outlined" onClick={action.onClick} sx={{ mt: 1.5 }}>
            {action.label}
          </Button>
        )}
      </Stack>
    </Box>
  );
}
