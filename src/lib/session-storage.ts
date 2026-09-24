import { invoke } from '@tauri-apps/api/core';
import type { AuthSession } from '@/types/domain';

/**
 * The ONLY module that persists the admin session.
 *
 * ── Where the token lives ──────────────────────────────────────────────────
 * In the operating system's credential store — macOS Keychain, Windows
 * Credential Manager, Linux Secret Service — reached through the Rust commands
 * in `src-tauri/src/keychain.rs`. It is never written to `localStorage`,
 * `sessionStorage`, IndexedDB or a file, so a script running in the WebView
 * cannot read it the way it could read web storage.
 *
 * ── Why not a cookie ───────────────────────────────────────────────────────
 * The stronger web answer is an httpOnly cookie, but the API returns the JWT in
 * the login response body and runs CORS with `credentials: false`. There is no
 * cookie to receive and none the browser would send back. Given that, the OS
 * keychain is the best persistence available for the current backend contract.
 *
 * ── What this does NOT do ──────────────────────────────────────────────────
 * Tauri is not treated as a security boundary. The backend authorises every
 * request from the bearer token; this only protects the token at rest.
 */

const STORE = 'store_session';
const LOAD = 'load_session';
const CLEAR = 'clear_session';

/**
 * True when running inside the Tauri shell.
 *
 * The renderer also runs in a plain browser during `bun run dev` and under
 * Vitest, where `invoke` does not exist. In that case the session is simply not
 * persisted: the app works for the session, and a reload signs you out. It
 * deliberately does NOT fall back to `localStorage` — a convenience fallback is
 * exactly how a token ends up in insecure storage in production.
 */
function hasSecureStorage(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export function isPersistenceAvailable(): boolean {
  return hasSecureStorage();
}

/** Validates the shape before trusting anything read back out of the store. */
function parse(raw: string | null): AuthSession | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const { accessToken, user } = parsed as Partial<AuthSession>;
    if (typeof accessToken !== 'string' || !accessToken) return null;
    if (!user || typeof user.id !== 'string' || typeof user.email !== 'string') return null;
    // A stored CUSTOMER session cannot happen through this app's login path,
    // but refusing to restore one costs nothing and closes the gap entirely.
    if (user.role !== 'ADMIN') return null;
    return { accessToken, user };
  } catch {
    return null;
  }
}

export async function readSession(): Promise<AuthSession | null> {
  if (!hasSecureStorage()) return null;
  try {
    return parse(await invoke<string | null>(LOAD));
  } catch (error) {
    // A locked keychain or a denied prompt reaches here. Treat it as signed out
    // rather than crashing the launch; the administrator can sign in again.
    if (import.meta.env.DEV) console.error('[session] could not read the credential store', error);
    return null;
  }
}

export async function writeSession(session: AuthSession): Promise<void> {
  if (!hasSecureStorage()) return;
  try {
    await invoke(STORE, { session: JSON.stringify(session) });
  } catch (error) {
    // The session still works in memory for this run; it just will not survive
    // a restart. Failing the sign-in over this would be worse.
    if (import.meta.env.DEV) console.error('[session] could not write the credential store', error);
  }
}

export async function clearSession(): Promise<void> {
  if (!hasSecureStorage()) return;
  try {
    await invoke(CLEAR);
  } catch (error) {
    if (import.meta.env.DEV) console.error('[session] could not clear the credential store', error);
  }
}
