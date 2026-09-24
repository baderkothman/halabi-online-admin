import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import { QueryProvider } from '@/app/providers/QueryProvider';
import { AuthProvider } from '@/app/providers/AuthProvider';
import { RequireAuth } from '@/app/router/RequireAuth';
import { LoginPage } from './LoginPage';
import { theme } from '@/theme';
import { routes } from '@/config/routes';

/**
 * Route protection and the sign-in path — the two behaviours where a regression
 * is a security-adjacent bug rather than a cosmetic one.
 */

// No Tauri in jsdom, so persistence is inert — matching how the app behaves in
// a browser, where it deliberately refuses to fall back to localStorage.
//
// Plain async functions rather than `vi.fn()`: `restoreAllMocks` in `afterEach`
// would strip a spy's implementation, leaving `readSession()` returning
// undefined for every test after the first.
vi.mock('@/lib/session-storage', () => ({
  readSession: () => Promise.resolve(null),
  writeSession: () => Promise.resolve(undefined),
  clearSession: () => Promise.resolve(undefined),
  isPersistenceAvailable: () => false,
}));

function mockLogin(role: 'ADMIN' | 'CUSTOMER') {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    text: () =>
      Promise.resolve(
        JSON.stringify({
          data: { accessToken: 'token', user: { id: '1', email: 'a@b.c', displayName: 'Admin', role } },
        }),
      ),
  });
}

function renderApp(initialPath: string) {
  return render(
    <ThemeProvider theme={theme}>
      <QueryProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={[initialPath]}>
            <Routes>
              <Route path={routes.login} element={<LoginPage />} />
              <Route element={<RequireAuth />}>
                <Route path={routes.dashboard} element={<p>Protected dashboard</p>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>,
  );
}

afterEach(() => vi.restoreAllMocks());

describe('route protection', () => {
  it('sends an unauthenticated visitor to the login screen', async () => {
    renderApp(routes.dashboard);
    expect(await screen.findByLabelText('Email')).toBeInTheDocument();
    expect(screen.queryByText('Protected dashboard')).not.toBeInTheDocument();
  });
});

describe('sign in', () => {
  it('admits an administrator', async () => {
    vi.stubGlobal('fetch', mockLogin('ADMIN'));
    renderApp(routes.login);

    await userEvent.type(await screen.findByLabelText('Email'), 'admin@halabi.test');
    await userEvent.type(screen.getByLabelText('Password'), 'correct-horse');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Protected dashboard')).toBeInTheDocument();
  });

  it('refuses a valid customer account with an explanation', async () => {
    // `POST /auth/login` is shared with the storefront and authenticates
    // customers too. The API would still reject them at every admin endpoint;
    // this check is so the failure is legible instead of a wall of 403s.
    vi.stubGlobal('fetch', mockLogin('CUSTOMER'));
    renderApp(routes.login);

    await userEvent.type(await screen.findByLabelText('Email'), 'customer@halabi.test');
    await userEvent.type(screen.getByLabelText('Password'), 'correct-horse');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('not an administrator account');
    expect(screen.queryByText('Protected dashboard')).not.toBeInTheDocument();
  });

  it('reports a wrong password without claiming the session expired', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false, status: 401,
        text: () => Promise.resolve(JSON.stringify({ message: 'Invalid email or password.' })),
      }),
    );
    renderApp(routes.login);

    await userEvent.type(await screen.findByLabelText('Email'), 'admin@halabi.test');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Incorrect email or password.'));
    expect(screen.queryByText(/session expired/i)).not.toBeInTheDocument();
  });
});
