import { createContext, use } from 'react';
import type { AuthSession, AuthUser } from '@/types/domain';

export interface AuthContextValue {
  /** `undefined` while the stored session is being restored at launch. */
  session: AuthSession | null | undefined;
  user: AuthUser | null;
  isRestoring: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  /** Set when the session ended because the API rejected the token. */
  expiredNotice: boolean;
  dismissExpiredNotice: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = use(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>.');
  return value;
}
