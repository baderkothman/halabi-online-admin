import type { InquiryDetail } from '@/types/domain';

/** Poll while an attempt is being sent, and while an email awaits its delivery event. */
const SENDING_POLL_MS = 3_000;
const DELIVERY_POLL_MS = 5_000;
/**
 * Stop polling once an attempt has sat unchanged this long. An attempt that is
 * still QUEUED after this (e.g. a backed-off email retry) waits for the next
 * trigger on the server, and polling the screen would not make it move faster.
 */
const GIVE_UP_AFTER_MS = 2 * 60_000;

/**
 * The inquiry detail's `refetchInterval`.
 *
 * Notifications are dispatched after the request that created them returns, and
 * email delivery is confirmed by a webhook later still, so the panel would
 * otherwise show "Queued" until the administrator reopened the inquiry.
 * Returns `false` (stop polling) when everything has settled.
 */
export function notificationRefetchInterval(
  inquiry: Pick<InquiryDetail, 'notificationAttempts'> | undefined,
  now: number = Date.now(),
): number | false {
  if (!inquiry) return false;
  let interval: number | false = false;

  for (const attempt of inquiry.notificationAttempts) {
    const age = now - Date.parse(attempt.updatedAt);
    if (!Number.isFinite(age) || age > GIVE_UP_AFTER_MS) continue;

    if (attempt.status === 'QUEUED' || attempt.status === 'SENDING') return SENDING_POLL_MS;
    if (attempt.channel === 'EMAIL' && attempt.status === 'ACCEPTED') interval = DELIVERY_POLL_MS;
  }
  return interval;
}
