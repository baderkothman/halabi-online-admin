import { Box, Button, Stack, Typography } from '@mui/material';
import CloudOffOutlinedIcon from '@mui/icons-material/CloudOffOutlined';
import { toDisplayMessage } from '@/services/api';

/**
 * Shown when a request failed.
 *
 * The message comes from the normalised `ApiError`, which is already written
 * for a human — raw backend exceptions and status codes never appear. Retry is
 * offered whenever the caller can actually retry, which for a TanStack query
 * means `refetch`.
 */
export interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  /** Overrides the derived message when the calling screen has better context. */
  title?: string;
}

export function ErrorState({ error, onRetry, title }: ErrorStateProps) {
  return (
    <Box role="alert" sx={{ display: 'grid', placeItems: 'center', px: 3, py: 7 }}>
      <Stack spacing={1} alignItems="center" sx={{ maxWidth: 380, textAlign: 'center' }}>
        <CloudOffOutlinedIcon sx={{ fontSize: 24, color: 'ink.muted' }} />
        <Typography variant="subtitle2">{title ?? 'Could not load this'}</Typography>
        <Typography variant="body2" color="ink.muted">
          {toDisplayMessage(error)}
        </Typography>
        {onRetry && (
          <Button size="small" variant="outlined" onClick={onRetry} sx={{ mt: 1.5 }}>
            Try again
          </Button>
        )}
      </Stack>
    </Box>
  );
}
