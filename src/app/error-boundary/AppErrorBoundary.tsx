import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';

interface Props {
  children: ReactNode;
  /** Resets when this changes, so navigating away recovers from a crashed route. */
  resetKey?: string;
}
interface State {
  error: Error | null;
}

/**
 * Catches render-time crashes so a bug in one screen cannot leave the operator
 * with a blank window and no way back.
 *
 * The error message itself is shown only in development. In production it is
 * logged and the user gets a plain explanation — a React stack trace tells an
 * administrator nothing and may leak internal detail.
 */
export class AppErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidUpdate(previous: Props) {
    if (this.state.error && previous.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ui] render failed', error, info.componentStack);
  }

  override render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <Box
        role="alert"
        sx={{
          display: 'grid',
          placeItems: 'center',
          height: '100%',
          p: 4,
          bgcolor: 'surfaceTone.canvas',
        }}
      >
        <Stack spacing={1.5} alignItems="center" sx={{ maxWidth: 420, textAlign: 'center' }}>
          <ReportProblemOutlinedIcon sx={{ fontSize: 28, color: 'ink.muted' }} />
          <Typography variant="h3">This screen stopped responding</Typography>
          <Typography variant="body2" color="ink.secondary">
            Nothing was lost. Try again, or move to another section and come back.
          </Typography>
          {import.meta.env.DEV && (
            <Typography
              variant="caption"
              component="pre"
              sx={{
                mt: 1, p: 1, width: '100%', textAlign: 'left', overflowX: 'auto',
                bgcolor: 'surfaceTone.sunken', border: 1, borderColor: 'line.subtle', borderRadius: 1,
                color: 'error.main', fontFamily: 'ui-monospace, monospace',
              }}
            >
              {error.message}
            </Typography>
          )}
          <Button variant="contained" onClick={() => this.setState({ error: null })} sx={{ mt: 1 }}>
            Try again
          </Button>
        </Stack>
      </Box>
    );
  }
}
