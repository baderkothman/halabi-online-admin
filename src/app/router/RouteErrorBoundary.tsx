import { Box, Button, Stack, Typography } from '@mui/material';
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';
import { toDisplayMessage } from '@/services/api';
import { HOME_ROUTE } from '@/config/routes';

/**
 * The router's error element.
 *
 * `AppErrorBoundary` catches render crashes *inside* the shell; this catches
 * everything the router itself surfaces — a failed route, a thrown response —
 * which would otherwise fall through to React Router's generic default screen
 * and drop the operator out of the application's own chrome.
 */
export function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  const message = isRouteErrorResponse(error)
    ? `${error.status} — ${error.statusText || 'That page could not be loaded.'}`
    : toDisplayMessage(error);

  return (
    <Box role="alert" sx={{ height: '100%', display: 'grid', placeItems: 'center', p: 4, bgcolor: 'surfaceTone.canvas' }}>
      <Stack spacing={1.25} alignItems="center" sx={{ maxWidth: 400, textAlign: 'center' }}>
        <Typography variant="h3">Something went wrong</Typography>
        <Typography variant="body2" color="ink.muted">
          {message}
        </Typography>
        <Button variant="contained" onClick={() => void navigate(HOME_ROUTE)} sx={{ mt: 1 }}>
          Go to the dashboard
        </Button>
      </Stack>
    </Box>
  );
}
