import type { AdminWatchListItem, InquiryListItem, InquiryStatus } from '@/types/domain';

/**
 * Dashboard insights derived from the lists the app already loads. The API
 * has no analytics endpoints, so everything here is computed client-side from
 * real records: no estimates and no invented series.
 */

export const TREND_DAYS = 30;

/** The working pipeline, in the order an inquiry moves through it. */
export const PIPELINE_STATUSES: InquiryStatus[] = ['NEW', 'VIEWED', 'CONTACTED', 'WAITING_FOR_CUSTOMER', 'IN_DISCUSSION'];

export interface DayCount {
  /** Local calendar day, YYYY-MM-DD. */
  day: string;
  count: number;
}

export interface WatchInterest {
  slug: string;
  name: string;
  brand: string;
  count: number;
}

export interface AttentionItem {
  id: string;
  name: string;
  brand: string;
}

export interface DashboardInsights {
  trend: DayCount[];
  last30: number;
  previous30: number;
  pipeline: Array<{ status: InquiryStatus; count: number }>;
  /** Converted share of resolved inquiries (converted + closed), or null before any are resolved. */
  conversionRate: number | null;
  resolved: number;
  topWatches: WatchInterest[];
  attention: { noPhoto: AttentionItem[]; noPrice: AttentionItem[]; unpublished: AttentionItem[] };
}

function localDay(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const toItem = (watch: AdminWatchListItem): AttentionItem => ({ id: watch.id, name: watch.name, brand: watch.brand });

export function computeInsights(
  inquiries: InquiryListItem[],
  watches: AdminWatchListItem[],
  now: Date = new Date(),
): DashboardInsights {
  // Day buckets for the last 30 local days, oldest first, today last.
  const days: DayCount[] = [];
  for (let offset = TREND_DAYS - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
    days.push({ day: localDay(date), count: 0 });
  }
  const bucket = new Map(days.map((entry) => [entry.day, entry]));
  const startOfWindow = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (TREND_DAYS - 1)).getTime();
  const startOfPrevious = startOfWindow - TREND_DAYS * 86_400_000;

  let previous30 = 0;
  const pipelineCounts = new Map<InquiryStatus, number>();
  const interest = new Map<string, WatchInterest>();
  let converted = 0;
  let closed = 0;

  for (const inquiry of inquiries) {
    const created = new Date(inquiry.createdAt);
    const time = created.getTime();
    if (Number.isFinite(time)) {
      const entry = bucket.get(localDay(created));
      if (entry) entry.count += 1;
      else if (time >= startOfPrevious && time < startOfWindow) previous30 += 1;
    }

    pipelineCounts.set(inquiry.status, (pipelineCounts.get(inquiry.status) ?? 0) + 1);
    if (inquiry.status === 'CONVERTED') converted += 1;
    if (inquiry.status === 'CLOSED') closed += 1;

    const key = inquiry.watchSlug || `${inquiry.watchBrand}:${inquiry.watchName}`;
    const current = interest.get(key) ?? { slug: inquiry.watchSlug, name: inquiry.watchName, brand: inquiry.watchBrand, count: 0 };
    current.count += 1;
    interest.set(key, current);
  }

  const resolved = converted + closed;
  // Archived and sold pieces no longer need catalogue work.
  const active = watches.filter((watch) => watch.availability !== 'ARCHIVED' && watch.availability !== 'SOLD');

  return {
    trend: days,
    last30: days.reduce((sum, entry) => sum + entry.count, 0),
    previous30,
    pipeline: PIPELINE_STATUSES.map((status) => ({ status, count: pipelineCounts.get(status) ?? 0 })),
    conversionRate: resolved > 0 ? converted / resolved : null,
    resolved,
    topWatches: [...interest.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)).slice(0, 5),
    attention: {
      noPhoto: active.filter((watch) => watch.images.length === 0).map(toItem),
      noPrice: active.filter((watch) => watch.publicPrice === null).map(toItem),
      unpublished: active.filter((watch) => watch.visibility === 'PRIVATE' && watch.availability === 'AVAILABLE').map(toItem),
    },
  };
}
