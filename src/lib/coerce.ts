/**
 * Coercion helpers for the API boundary.
 *
 * These exist because of a concrete, verifiable trait of the backend rather
 * than defensive habit: the API queries Postgres through `pg`, which returns
 * `numeric` columns and `count(*)` aggregates as STRINGS, not numbers. So
 * `publicPrice` arrives as `"4200.00"` and `unreadCount` as `"3"`.
 *
 * Every API service normalises through here, so the rest of the application can
 * rely on its domain types being literally true. Anything unparseable becomes
 * `null` rather than `NaN`, which would silently poison arithmetic and render
 * as "NaN" in the UI.
 */

export function toNumberOrNull(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** For counts, where "absent" and "zero" mean the same thing operationally. */
export function toCount(value: unknown): number {
  return toNumberOrNull(value) ?? 0;
}

/**
 * A required string field from the API.
 *
 * `String(unknown)` is the wrong tool here: handed an object it produces
 * "[object Object]", which would then be rendered into a table cell or, worse,
 * interpolated into a URL. Only primitives convert; anything else falls back.
 */
export function toText(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint') return String(value);
  return fallback;
}

export function toStringOrNull(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint') return String(value);
  return null;
}

export function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === 'true' || value === 't';
  return false;
}

/**
 * Narrows an unknown value to a member of a known union, falling back when the
 * API sends something this build has never heard of — a new enum member added
 * backend-first, for instance. Falling back keeps the screen rendering instead
 * of throwing inside a table row.
 */
export function toEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

/** Records are objects; anything else from the API is treated as an empty one. */
export function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}
