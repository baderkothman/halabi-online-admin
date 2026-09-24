import { createContext, use, useCallback, useMemo, useState, type ReactNode } from 'react';
import { Alert, Snackbar } from '@mui/material';

/**
 * Application-wide transient feedback.
 *
 * One snackbar at a time, bottom-left so it never covers the primary action in
 * a dialog's bottom-right. Errors stay until dismissed; confirmations
 * auto-hide, because "Changes saved" that lingers is noise.
 */

type Severity = 'success' | 'error' | 'info';
interface Notice {
  id: number;
  message: string;
  severity: Severity;
}

interface SnackbarContextValue {
  notifySuccess: (message: string) => void;
  notifyError: (message: string) => void;
  notifyInfo: (message: string) => void;
}

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

export function useSnackbar(): SnackbarContextValue {
  const value = use(SnackbarContext);
  if (!value) throw new Error('useSnackbar must be used inside <SnackbarProvider>.');
  return value;
}

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<Notice | null>(null);

  const push = useCallback((message: string, severity: Severity) => {
    // A fresh id on every push restarts the auto-hide timer even when the same
    // message fires twice in a row.
    setNotice({ id: Date.now(), message, severity });
  }, []);

  const value = useMemo<SnackbarContextValue>(
    () => ({
      notifySuccess: (message) => push(message, 'success'),
      notifyError: (message) => push(message, 'error'),
      notifyInfo: (message) => push(message, 'info'),
    }),
    [push],
  );

  return (
    <SnackbarContext value={value}>
      {children}
      <Snackbar
        key={notice?.id}
        open={notice !== null}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        autoHideDuration={notice?.severity === 'error' ? null : 4000}
        onClose={(_, reason) => {
          // Clicking away should not dismiss an error the user may still be reading.
          if (reason === 'clickaway') return;
          setNotice(null);
        }}
      >
        <Alert
          severity={notice?.severity ?? 'info'}
          variant="filled"
          onClose={() => setNotice(null)}
          sx={{ maxWidth: 480 }}
        >
          {notice?.message}
        </Alert>
      </Snackbar>
    </SnackbarContext>
  );
}
