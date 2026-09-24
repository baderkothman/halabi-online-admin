import { requestData } from './client';
import { asRecord, toCount } from '@/lib/coerce';
import type { DashboardSummary } from '@/types/domain';

/**
 * `GET /admin/dashboard/summary` returns four counts, computed in one SQL
 * round trip with `::int` casts — so unlike most numeric columns these do
 * arrive as real numbers. They are still coerced, because relying on a cast in
 * someone else's query is not a contract.
 *
 * The summary counts only AVAILABLE watches that are also PUBLIC, which is the
 * business-meaningful figure ("how many pieces can a customer actually inquire
 * about right now") rather than a raw row count. The dashboard labels it
 * accordingly.
 */
export async function getSummary(signal?: AbortSignal): Promise<DashboardSummary> {
  const row = asRecord(await requestData<unknown>('/admin/dashboard/summary', signal ? { signal } : {}));
  return {
    available: toCount(row.available),
    sold: toCount(row.sold),
    new_inquiries: toCount(row.new_inquiries),
    active_discussions: toCount(row.active_discussions),
  };
}
