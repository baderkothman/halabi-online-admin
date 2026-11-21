import { createContext, use, useCallback, useMemo, useState, type ReactNode } from 'react';
import { Alert, Button, Snackbar } from '@mui/material';

/**
 * Application-wide transient feedback.
 *
 * One snackbar at a time, bottom-left so it never covers the primary action in
 * a dialog's bottom-right. Errors stay until dismissed; confirmations
 * auto-hide, because "Changes saved" that lingers is noise.
 */

type Severity = 'success' | 'error' | 'info';
export interface NoticeAction {
  label: string;
  onClick: () => void;
}
interface Notice {
  id: number;
  message: string;
  severity: Severity;
  action?: NoticeAction | undefined;
}

interface SnackbarContextValue {
  notifySuccess: (message: string) => void;
  notifyError: (message: string) => void;
  notifyInfo: (message: string, action?: NoticeAction) => void;
}

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

export function useSnackbar(): SnackbarContextValue {
  const value = use(SnackbarContext);
  if (!value) throw new Error('useSnackbar must be used inside <SnackbarProvider>.');
  return value;
}

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<Notice | null>(null);

  const push = useCallback((message: string, severity: Severity, action?: NoticeAction) => {
    // A fresh id on every push restarts the auto-hide timer even when the same
    // message fires twice in a row.
    setNotice({ id: Date.now(), message, severity, action });
  }, []);

  const value = useMemo<SnackbarContextValue>(
    () => ({
      notifySuccess: (message) => push(message, 'success'),
      notifyError: (message) => push(message, 'error'),
      notifyInfo: (message, action) => push(message, 'info', action),
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
        // Errors stay until dismissed; a notice with an action stays long enough to use it.
        autoHideDuration={notice?.severity === 'error' ? null : notice?.action ? 10_000 : 4000}
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
          {...(notice?.action
            ? {
                action: (
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => {
                      notice.action?.onClick();
                      setNotice(null);
                    }}
                  >
                    {notice.action.label}
                  </Button>
                ),
              }
            : {})}
          sx={{ maxWidth: 480 }}
        >
          {notice?.message}
        </Alert>
      </Snackbar>
    </SnackbarContext>
  );
}
