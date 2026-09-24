import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AuthContext, type AuthContextValue } from '@/features/auth/auth-context';
import { authApi, setAuthToken, setUnauthorizedHandler } from '@/services/api';
import { clearSession, readSession, writeSession } from '@/lib/session-storage';
import type { AuthSession } from '@/types/domain';

/**
 * Owns the admin session: restore at launch, sign in, sign out, and the
 * forced sign-out that follows a 401 from anywhere in the application.
 *
 * The token is pushed into the API client (`setAuthToken`) rather than read
 * from context by each caller, so that requests fired outside React — a query
 * retry, a background refetch — always carry the current token.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null | undefined>(undefined);
  const [expiredNotice, setExpiredNotice] = useState(false);
  const queryClient = useQueryClient();

  // Sign-out is callable both from the account menu and from the API client's
  // 401 handler.
  const endSession = useCallback(
    (reason: 'user' | 'expired') => {
      setAuthToken(null);
      void clearSession();
      setSession(null);
      setExpiredNotice(reason === 'expired');
      // Cached admin data outlives the session otherwise, and the next person
      // to sign in would briefly see the previous account's inquiries.
      queryClient.clear();
    },
    [queryClient],
  );

  // Re-registered whenever `endSession` changes rather than captured once
  // through a ref: a ref written during render can leak from work React
  // discards, and `endSession` only changes when the query client does.
  useEffect(() => {
    setUnauthorizedHandler(() => endSession('expired'));
    return () => setUnauthorizedHandler(null);
  }, [endSession]);

  // Restore a stored session once, at launch.
  useEffect(() => {
    let cancelled = false;
    void readSession().then((restored) => {
      if (cancelled) return;
      if (restored) setAuthToken(restored.accessToken);
      setSession(restored);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const next = await authApi.login(email, password);
      setAuthToken(next.accessToken);
      await writeSession(next);
      setExpiredNotice(false);
      setSession(next);
    },
    [],
  );

  const signOut = useCallback(() => endSession('user'), [endSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isRestoring: session === undefined,
      isAuthenticated: Boolean(session),
      signIn,
      signOut,
      expiredNotice,
      dismissExpiredNotice: () => setExpiredNotice(false),
    }),
    [session, signIn, signOut, expiredNotice],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
