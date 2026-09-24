import {
  ApiError, ConflictError, ForbiddenError, MalformedResponseError, NetworkError,
  NotFoundError, TimeoutError, UnauthorizedError, ValidationError,
} from './errors';

/**
 * The one place this application talks to the network.
 *
 * No component, hook or feature module may call `fetch` directly. Base URL,
 * timeouts, auth header, error normalisation and 401 handling have a single
 * definition here so they cannot drift.
 */

const API_PREFIX = '/api/v1';
const DEFAULT_TIMEOUT_MS = 15_000;

/**
 * `127.0.0.1` rather than `localhost`: the API binds IPv4, and resolving
 * `localhost` to IPv6 `::1` first produces a connection refused that looks like
 * the API is down when it is running perfectly well.
 */
function resolveBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (!configured) {
    throw new Error(
      'VITE_API_BASE_URL is not set. Copy .env.example to .env and point it at the Halabi Online API.',
    );
  }
  return configured.replace(/\/+$/, '');
}

/**
 * The bearer token, held in a module-scoped variable rather than in React state.
 *
 * The token is needed by every request, including ones fired from TanStack Query
 * cache callbacks that have no component context. Keeping it here — set by the
 * auth provider, never read from storage by this module — means the client has
 * no React dependency and the storage decision stays in one other place
 * (`lib/session-storage.ts`, which uses the OS keychain).
 */
let authToken: string | null = null;

/** Called when any request returns 401, so the app can tear down the session. */
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

export type QueryValue = string | number | boolean | undefined | null;

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
  timeoutMs?: number;
  /**
   * Skips the 401 teardown. Only the login request sets this: a wrong password
   * is also a 401, and it must not look like an expired session.
   */
  skipAuthRedirect?: boolean;
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(`${resolveBaseUrl()}${API_PREFIX}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

/** Pulls `message` out of a NestJS error body, tolerating both of its shapes. */
function extractMessages(body: unknown): string[] {
  if (typeof body !== 'object' || body === null) return [];
  const message = (body as { message?: unknown }).message;
  if (typeof message === 'string') return [message];
  if (Array.isArray(message)) return message.filter((item): item is string => typeof item === 'string');
  return [];
}

function toApiError(status: number, body: unknown): ApiError {
  const messages = extractMessages(body);
  switch (status) {
    case 400:
    case 422:
      return new ValidationError(status, messages);
    case 401:
      return new UnauthorizedError(messages);
    case 403:
      return new ForbiddenError(messages);
    case 404:
      return new NotFoundError(messages);
    case 409:
      return new ConflictError(messages);
    default:
      return new ApiError(status, messages);
  }
}

/**
 * Combines a caller-supplied signal with a timeout.
 *
 * Written by hand rather than with `AbortSignal.any`, which is not available in
 * every WebView Tauri ships against.
 */
function withTimeout(timeoutMs: number, external?: AbortSignal) {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const onExternalAbort = () => controller.abort();
  if (external) {
    if (external.aborted) controller.abort();
    else external.addEventListener('abort', onExternalAbort, { once: true });
  }

  return {
    signal: controller.signal,
    didTimeOut: () => timedOut,
    cleanup: () => {
      clearTimeout(timer);
      external?.removeEventListener('abort', onExternalAbort);
    },
  };
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, signal: externalSignal, timeoutMs = DEFAULT_TIMEOUT_MS, skipAuthRedirect } = options;

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const timeout = withTimeout(timeoutMs, externalSignal);
  const url = buildUrl(path, query);

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      signal: timeout.signal,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch (cause) {
    if (timeout.didTimeOut()) throw new TimeoutError();
    if (externalSignal?.aborted) throw cause;
    // `NetworkError` carries no technical detail because it is shown to the
    // administrator. In development the real reason is logged so there is
    // something to debug with; never in production, and never the token.
    if (import.meta.env.DEV) console.error(`[api] ${method} ${url} failed`, cause);
    throw new NetworkError(cause);
  } finally {
    timeout.cleanup();
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  let parsed: unknown;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      // A non-JSON body means something upstream answered — a proxy error page.
      throw response.ok ? new MalformedResponseError() : new ApiError(response.status, []);
    }
  }

  if (!response.ok) {
    const error = toApiError(response.status, parsed);
    if (error instanceof UnauthorizedError && !skipAuthRedirect) onUnauthorized?.();
    throw error;
  }

  return parsed as T;
}

/** Every API response is wrapped in `{ data }`; a few paginated ones add `meta`. */
export interface Envelope<T> {
  data: T;
  meta?: { page?: number; pageSize?: number; total?: number };
}

/** Unwraps `{ data }`, failing loudly if the envelope is missing. */
export async function requestData<T>(path: string, options?: RequestOptions): Promise<T> {
  const envelope = await request<Envelope<T>>(path, options);
  if (!envelope || typeof envelope !== 'object' || !('data' in envelope)) throw new MalformedResponseError();
  return envelope.data;
}

/** Unwraps `{ data, meta }` for the endpoints that paginate. */
export async function requestPage<T>(path: string, options?: RequestOptions): Promise<Envelope<T>> {
  const envelope = await request<Envelope<T>>(path, options);
  if (!envelope || typeof envelope !== 'object' || !('data' in envelope)) throw new MalformedResponseError();
  return envelope;
}
