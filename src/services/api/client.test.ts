import { afterEach, describe, expect, it, vi } from 'vitest';
import { request, setAuthToken, setUnauthorizedHandler } from './client';
import { ConflictError, NetworkError, NotFoundError, UnauthorizedError } from './errors';

/**
 * These cover the boundary the whole application depends on: that a backend
 * failure becomes a typed, displayable error and that a 401 tears the session
 * down exactly once.
 */

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  setAuthToken(null);
  setUnauthorizedHandler(null);
});

describe('request', () => {
  it('maps a 400 to ValidationError carrying the API messages', async () => {
    vi.stubGlobal('fetch', mockFetch(400, { message: ['slug must be a string', 'name should not be empty'] }));

    await expect(request('/admin/dashboard/watches', { method: 'POST', body: {} })).rejects.toMatchObject({
      name: 'ValidationError',
      details: ['slug must be a string', 'name should not be empty'],
    });
  });

  it('maps 404 and 409 to their own classes', async () => {
    vi.stubGlobal('fetch', mockFetch(404, { message: 'Watch not found.' }));
    await expect(request('/x')).rejects.toBeInstanceOf(NotFoundError);

    vi.stubGlobal('fetch', mockFetch(409, { message: 'An account with this email already exists.' }));
    await expect(request('/y')).rejects.toBeInstanceOf(ConflictError);
  });

  it('calls the unauthorized handler once on a 401', async () => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    vi.stubGlobal('fetch', mockFetch(401, { message: 'Your session has expired.' }));

    await expect(request('/admin/inquiries')).rejects.toBeInstanceOf(UnauthorizedError);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('does NOT tear down the session when the caller opts out', async () => {
    // A wrong password is also a 401. Treating it as an expired session would
    // replace the field error with a session banner on the login screen.
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    vi.stubGlobal('fetch', mockFetch(401, { message: 'Invalid email or password.' }));

    await expect(request('/auth/login', { method: 'POST', skipAuthRedirect: true })).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('turns an unreachable API into NetworkError, not a raw fetch failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const error = await request('/health').catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(NetworkError);
    expect((error as NetworkError).message).toContain('Cannot reach the Halabi Online API');
  });

  it('attaches the bearer token when one is set, and omits it when not', async () => {
    const fetchMock = mockFetch(200, { data: [] });
    vi.stubGlobal('fetch', fetchMock);

    setAuthToken('a-token');
    await request('/admin/inquiries');
    const authorized = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(authorized.headers).toMatchObject({ Authorization: 'Bearer a-token' });

    setAuthToken(null);
    await request('/public/watches');
    expect((fetchMock.mock.calls[1]?.[1] as RequestInit).headers).not.toHaveProperty('Authorization');
  });
});
