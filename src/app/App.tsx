import { CssBaseline, ThemeProvider } from '@mui/material';
import { RouterProvider } from 'react-router-dom';
import { theme } from '@/theme';
import { router } from './router/router';
import { QueryProvider } from './providers/QueryProvider';
import { AuthProvider } from './providers/AuthProvider';
import { SnackbarProvider } from './providers/SnackbarProvider';
import { AppErrorBoundary } from './error-boundary/AppErrorBoundary';

/**
 * Provider order matters:
 *
 * - `QueryProvider` wraps `AuthProvider`, because signing out clears the query
 *   cache and therefore needs the client.
 * - `SnackbarProvider` sits inside both, so any screen or mutation can report.
 * - The error boundary is outermost, so a crash in a provider itself still
 *   renders something rather than a white window.
 */
export function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppErrorBoundary>
        <QueryProvider>
          <AuthProvider>
            <SnackbarProvider>
              <RouterProvider router={router} />
            </SnackbarProvider>
          </AuthProvider>
        </QueryProvider>
      </AppErrorBoundary>
    </ThemeProvider>
  );
}
