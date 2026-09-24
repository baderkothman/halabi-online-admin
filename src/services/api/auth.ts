import { requestData } from './client';
import { asRecord, toEnum, toText } from '@/lib/coerce';
import type { AuthSession } from '@/types/domain';
import { ForbiddenError } from './errors';

/**
 * `POST /api/v1/auth/login` is shared with the storefront — it authenticates
 * customers and administrators alike and returns the same envelope for both.
 *
 * This application therefore has to reject a valid CUSTOMER login itself. That
 * is a usability measure, not a security one: every admin endpoint is guarded
 * server-side by `RolesGuard`, so a customer token that slipped past this check
 * would still get a 403 from the API on the first request.
 */
export async function login(email: string, password: string): Promise<AuthSession> {
  const data = asRecord(
    await requestData<unknown>('/auth/login', {
      method: 'POST',
      body: { email, password },
      // A wrong password is also a 401 and must not trigger the expired-session
      // teardown, which would replace the field error with a session banner.
      skipAuthRedirect: true,
    }),
  );

  const user = asRecord(data.user);
  const role = toEnum(user.role, ['ADMIN', 'CUSTOMER'] as const, 'CUSTOMER');

  if (role !== 'ADMIN') {
    throw new ForbiddenError(['This application is for Halabi Online administrators.']);
  }

  return {
    accessToken: toText(data.accessToken),
    user: {
      id: toText(user.id),
      email: toText(user.email),
      displayName: toText(user.displayName),
      role,
    },
  };
}

/**
 * There is no logout endpoint: the API issues stateless JWTs and keeps no
 * server-side session to invalidate. Signing out therefore means discarding the
 * token locally, which `AuthProvider` does. Documented here so the absence
 * reads as a known contract fact rather than an omission.
 */
