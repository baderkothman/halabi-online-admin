/**
 * Display formatting.
 *
 * Centralised so that a price or a date looks identical in a table, a detail
 * pane and a dialog. Locale is fixed to `en-GB` rather than the machine's: an
 * internal tool should render the same figures on every workstation, and
 * day/month ordering that changes per laptop is a real source of error when
 * people read dates aloud to each other.
 */

const LOCALE = 'en-GB';

const currencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Prices are whole-dollar in practice, and cents on a five-figure watch are
 * noise in a table. `null` is rendered as an em dash, never as "$0" — no price
 * set and a price of zero are different facts.
 */
export function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return currencyFormatter.format(value);
}

const dateFormatter = new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: 'short', year: 'numeric' });
const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value: string | null | undefined): string {
  const date = parseDate(value);
  return date ? dateFormatter.format(date) : '—';
}

export function formatDateTime(value: string | null | undefined): string {
  const date = parseDate(value);
  return date ? dateTimeFormatter.format(date) : '—';
}

/**
 * Relative time for list views, where "2h ago" answers the operational question
 * ("is this stale?") faster than a timestamp does. Absolute time is still shown
 * on hover and in detail views, because relative time alone is useless for
 * anything you need to reference later.
 */
export function formatRelative(value: string | null | undefined): string {
  const date = parseDate(value);
  if (!date) return '—';

  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 45) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.round(days / 7)}w ago`;
  return dateFormatter.format(date);
}

/** Initials for an avatar, from a customer's display name. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}
