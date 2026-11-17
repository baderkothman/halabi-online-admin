import { useState } from 'react';
import { Alert, Box, Button, Link, Stack, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './auth-context';
import { HOME_ROUTE } from '@/config/routes';
import { ForbiddenError, NetworkError, UnauthorizedError, toDisplayMessage } from '@/services/api';
import { isPersistenceAvailable } from '@/lib/session-storage';

const schema = z.object({
  email: z.string().min(1, 'Enter your email address.').email('That does not look like an email address.'),
  password: z.string().min(1, 'Enter your password.'),
});

type LoginFields = z.infer<typeof schema>;

/**
 * Sign-in.
 *
 * Failures are shown as a single form-level message rather than against a
 * field: the API cannot distinguish "no such account" from "wrong password" —
 * and should not, since that difference tells an attacker which emails exist.
 */
export function LoginPage() {
  const { signIn, isAuthenticated, expiredNotice, dismissExpiredNotice } = useAuth();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFields>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  if (isAuthenticated) {
    // Return to wherever the guard interrupted, or the dashboard.
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from ?? HOME_ROUTE} replace />;
  }

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setFormError(null);
    dismissExpiredNotice();
    try {
      await signIn(email, password);
    } catch (error) {
      // A valid customer account reaching the admin app is a distinct case and
      // deserves a message that explains it rather than "invalid credentials".
      if (error instanceof ForbiddenError) setFormError('This account is not an administrator account.');
      else if (error instanceof UnauthorizedError) setFormError('Incorrect email or password.');
      else if (error instanceof NetworkError) setFormError(error.message);
      else setFormError(toDisplayMessage(error));
    }
  });

  return (
    <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', bgcolor: 'surfaceTone.canvas', p: 3 }}>
      <Box sx={{ width: '100%', maxWidth: 340 }}>
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 3 }}>
          <Box
            aria-hidden
            sx={{
              width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
              border: 1.5, borderColor: 'ink.primary', position: 'relative',
            }}
          >
            {/* A watch face, not an abstract mark — the catalogue this app runs is the reason to draw one.
                Hands set to ten past ten: the angle watch photography always uses, because it frames the
                dial without crossing the brand name. */}
            <Box
              sx={{
                position: 'absolute', left: '50%', bottom: '50%', width: 1.5, height: 7, bgcolor: 'ink.primary',
                borderRadius: 1, transformOrigin: 'bottom center', transform: 'translateX(-50%) rotate(-60deg)',
              }}
            />
            <Box
              sx={{
                position: 'absolute', left: '50%', bottom: '50%', width: 1.5, height: 9.5, bgcolor: 'ink.primary',
                borderRadius: 1, transformOrigin: 'bottom center', transform: 'translateX(-50%) rotate(60deg)',
              }}
            />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ lineHeight: 1.2 }}>
              Halabi Online
            </Typography>
            <Typography variant="caption" color="ink.muted" sx={{ letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: 10 }}>
              Administration
            </Typography>
          </Box>
        </Stack>

        {expiredNotice && (
          <Alert severity="info" sx={{ mb: 2 }} onClose={dismissExpiredNotice}>
            Your session expired. Sign in to continue.
          </Alert>
        )}

        <Box component="form" onSubmit={(event) => void onSubmit(event)} noValidate>
          <Stack spacing={1.75}>
            {formError && (
              // `role="alert"` so the failure is announced, not merely displayed.
              <Alert severity="error" role="alert" onClose={() => setFormError(null)}>
                {formError}
              </Alert>
            )}

            <TextField
              {...register('email')}
              label="Email"
              type="email"
              autoComplete="username"
              autoFocus
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
              slotProps={{ htmlInput: { 'aria-invalid': Boolean(errors.email) } }}
            />

            <TextField
              {...register('password')}
              label="Password"
              type="password"
              autoComplete="current-password"
              error={Boolean(errors.password)}
              helperText={errors.password?.message}
              slotProps={{ htmlInput: { 'aria-invalid': Boolean(errors.password) } }}
            />

            <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </Stack>
        </Box>

        {!isPersistenceAvailable() && (
          // Running in a browser rather than the desktop shell. Saying so is
          // better than letting someone wonder why they are signed out on reload.
          <Typography variant="caption" color="ink.muted" sx={{ display: 'block', mt: 2.5 }}>
            Running outside the desktop app — your session will not be remembered after a reload. Use{' '}
            <Link component="span" sx={{ fontFamily: 'ui-monospace, monospace' }}>
              bun run desktop
            </Link>{' '}
            for the full application.
          </Typography>
        )}
      </Box>
    </Box>
  );
}
