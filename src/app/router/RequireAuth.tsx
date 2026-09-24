import { Box, CircularProgress } from '@mui/material';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/auth-context';
import { routes } from '@/config/routes';

/**
 * Gate for every administrative route.
 *
 * This is navigation, not authorization. The API guards each admin endpoint
 * with `JwtAuthGuard` + `RolesGuard`, and a token that got past this component
 * would still be rejected server-side. Hiding a route is never a security
 * control, and nothing here should be treated as one.
 */
export function RequireAuth() {
  const { isAuthenticated, isRestoring } = useAuth();
  const location = useLocation();

  if (isRestoring) {
    // Reading the OS keychain is asynchronous. Redirecting to /login during
    // that window would flash the sign-in form at every launch.
    return (
      <Box sx={{ height: '100%', display: 'grid', placeItems: 'center' }}>
        <CircularProgress size={22} aria-label="Restoring your session" />
      </Box>
    );
  }

  if (!isAuthenticated) {
    // `state.from` lets the login screen return the operator to where they were.
    return <Navigate to={routes.login} replace state={{ from: location.pathname + location.search }} />;
  }

  return <Outlet />;
}
