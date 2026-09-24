/**
 * Normalised API errors.
 *
 * Every failure the application can show an administrator is one of these
 * classes. Feature code branches on the class, never on a status code, and the
 * `message` on each is already safe to display — raw backend text and stack
 * traces never reach the UI.
 */

export class ApiError extends Error {
  readonly status: number;
  /** Field-level or multi-line detail from the API, already sanitised. */
  readonly details: string[];

  constructor(status: number, details: string[], message?: string) {
    super(message ?? details[0] ?? 'Something went wrong. Please try again.');
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/** 400/422 — the request was rejected by validation. `details` lists the reasons. */
export class ValidationError extends ApiError {
  constructor(status: number, details: string[]) {
    super(status, details, details[0] ?? 'Please check the highlighted fields and try again.');
    this.name = 'ValidationError';
  }
}

/**
 * 401 — no session, or the session has expired.
 *
 * The API returns this for both cases with no way to tell them apart, so the
 * app treats it uniformly: sign out and ask for credentials again.
 */
export class UnauthorizedError extends ApiError {
  constructor(details: string[] = []) {
    super(401, details, 'Your session has expired. Please sign in again.');
    this.name = 'UnauthorizedError';
  }
}

/** 403 — authenticated, but this account may not do that. */
export class ForbiddenError extends ApiError {
  constructor(details: string[] = []) {
    super(403, details, 'You do not have permission to do that.');
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends ApiError {
  constructor(details: string[] = []) {
    super(404, details, 'That record no longer exists.');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ApiError {
  constructor(details: string[] = []) {
    super(409, details, details[0] ?? 'That change conflicts with existing data.');
    this.name = 'ConflictError';
  }
}

/** The API could not be reached at all — it is down, or the machine is offline. */
export class NetworkError extends ApiError {
  constructor(override readonly cause?: unknown) {
    super(0, [], 'Cannot reach the Halabi Online API. Check that it is running and try again.');
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends ApiError {
  constructor() {
    super(0, [], 'The request took too long. The API may be under load.');
    this.name = 'TimeoutError';
  }
}

/** The API answered, but not with the shape the contract promises. */
export class MalformedResponseError extends ApiError {
  constructor() {
    super(0, [], 'The API returned an unexpected response.');
    this.name = 'MalformedResponseError';
  }
}

/**
 * Anything at all, reduced to a message safe to show.
 *
 * Used by the snackbar and error boundaries so that a thrown non-`ApiError` —
 * a TypeError from a bad render, say — still produces something readable
 * instead of "[object Object]".
 */
export function toDisplayMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return 'Something went wrong. Please try again.';
}

/** True when the failure means the stored session is no longer usable. */
export function isSessionExpired(error: unknown): boolean {
  return error instanceof UnauthorizedError;
}
