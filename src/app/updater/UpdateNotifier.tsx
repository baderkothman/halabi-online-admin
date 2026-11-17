import { useEffect, useState } from 'react';
import { check, type Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { Button, LinearProgress, Snackbar, Stack, Typography } from '@mui/material';
import { isDesktopApp } from '@/lib/updater';

type Phase = 'idle' | 'available' | 'installing' | 'restarting';

/**
 * Checks GitHub Releases for a newer signed build once per launch and offers
 * to install it in place. There is no "Remind me later" that reschedules a
 * check — the admin team is small and a release lands rarely enough that the
 * next app launch is reminder enough.
 */
export function UpdateNotifier() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [update, setUpdate] = useState<Update | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isDesktopApp()) return;
    let cancelled = false;
    check()
      .then((found) => {
        if (!cancelled && found) {
          setUpdate(found);
          setPhase('available');
        }
      })
      .catch((error) => {
        // No network, no release yet, or a flaky GitHub fetch — the current
        // build keeps working either way, so this never surfaces to the user.
        if (import.meta.env.DEV) console.error('[updater] check failed', error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function installAndRestart() {
    if (!update) return;
    setPhase('installing');
    let total = 0;
    let received = 0;
    try {
      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            total = event.data.contentLength ?? 0;
            break;
          case 'Progress':
            received += event.data.chunkLength;
            setProgress(total > 0 ? Math.min(100, Math.round((received / total) * 100)) : 0);
            break;
          case 'Finished':
            setProgress(100);
            break;
        }
      });
      setPhase('restarting');
      await relaunch();
    } catch (error) {
      if (import.meta.env.DEV) console.error('[updater] install failed', error);
      setPhase('available');
    }
  }

  if (phase === 'idle' || !update) return null;

  return (
    <Snackbar
      open
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      sx={{ maxWidth: 420 }}
    >
      <Stack
        spacing={1.5}
        sx={{ bgcolor: 'grey.900', color: 'common.white', borderRadius: 1, p: 2, minWidth: 320 }}
      >
        {phase === 'available' && (
          <>
            <Typography variant="body2">
              Version {update.version} is available (you have {update.currentVersion}).
            </Typography>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button size="small" color="inherit" onClick={() => setPhase('idle')}>
                Later
              </Button>
              <Button size="small" variant="contained" onClick={() => void installAndRestart()}>
                Update & Restart
              </Button>
            </Stack>
          </>
        )}
        {phase === 'installing' && (
          <>
            <Typography variant="body2">Downloading update…</Typography>
            <LinearProgress
              variant={progress > 0 ? 'determinate' : 'indeterminate'}
              value={progress}
            />
          </>
        )}
        {phase === 'restarting' && <Typography variant="body2">Restarting…</Typography>}
      </Stack>
    </Snackbar>
  );
}
