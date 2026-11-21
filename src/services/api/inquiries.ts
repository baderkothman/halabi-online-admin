import { requestData } from './client';
import { asArray, asRecord, toBoolean, toCount, toEnum, toStringOrNull, toText } from '@/lib/coerce';
import {
  CONTACT_METHOD, INQUIRY_STATUS, MESSAGE_SENDER, NOTIFICATION_CHANNEL, NOTIFICATION_EVENT, NOTIFICATION_STATUS,
  type InquiryDetail, type InquiryListItem, type InquiryMessage, type InquiryStatus, type NotificationAttempt,
} from '@/types/domain';

/**
 * Inquiry endpoints — the busiest surface in this application.
 *
 * `GET /admin/inquiries` accepts a single optional `status` parameter and
 * returns every matching inquiry, ordered by `updated_at DESC`. There is no
 * pagination, no text search and no date range; those are applied client-side
 * in the inquiries feature, and the backend requirements are recorded in
 * docs/API-INTEGRATION.md.
 */

function toListItem(raw: unknown): InquiryListItem {
  const row = asRecord(raw);
  return {
    id: toText(row.id),
    customerName: toText(row.customerName),
    email: toStringOrNull(row.email),
    phone: toStringOrNull(row.phone),
    status: toEnum(row.status, INQUIRY_STATUS, 'NEW'),
    createdAt: toText(row.createdAt),
    watchSlug: toText(row.watchSlug),
    watchName: toText(row.watchName),
    watchBrand: toText(row.watchBrand),
    // A `count(*)` aggregate: Postgres bigint, which `pg` returns as a string.
    unreadCount: toCount(row.unreadCount),
  };
}

function toMessage(raw: unknown): InquiryMessage {
  const row = asRecord(raw);
  return {
    id: toText(row.id),
    senderType: toEnum(row.senderType, MESSAGE_SENDER, 'SYSTEM'),
    body: toText(row.body),
    createdAt: toText(row.createdAt),
    readAt: toStringOrNull(row.readAt),
  };
}

function toNotificationAttempt(raw: unknown): NotificationAttempt {
  const row = asRecord(raw);
  return {
    id: toText(row.id),
    eventType: toEnum(row.eventType, NOTIFICATION_EVENT, 'INQUIRY_CREATED'),
    channel: toEnum(row.channel, NOTIFICATION_CHANNEL, 'EMAIL'),
    recipientLabel: toText(row.recipientLabel),
    // An unrecognised status is shown as UNKNOWN rather than as a success.
    status: toEnum(row.status, NOTIFICATION_STATUS, 'UNKNOWN'),
    attemptCount: toCount(row.attemptCount),
    lastError: toStringOrNull(row.lastError),
    createdAt: toText(row.createdAt),
    updatedAt: toText(row.updatedAt),
    retryable: toBoolean(row.retryable),
  };
}

export async function listInquiries(status?: InquiryStatus, signal?: AbortSignal): Promise<InquiryListItem[]> {
  const data = await requestData<unknown>('/admin/inquiries', {
    ...(status ? { query: { status } } : {}),
    ...(signal ? { signal } : {}),
  });
  return asArray(data).map(toListItem);
}

export async function getInquiry(id: string, signal?: AbortSignal): Promise<InquiryDetail> {
  const row = asRecord(
    await requestData<unknown>(`/admin/inquiries/${encodeURIComponent(id)}`, signal ? { signal } : {}),
  );
  return {
    id: toText(row.id),
    status: toEnum(row.status, INQUIRY_STATUS, 'NEW'),
    customerName: toText(row.customerName),
    email: toStringOrNull(row.email),
    phone: toStringOrNull(row.phone),
    preferredContactMethod: toEnum(row.preferredContactMethod, CONTACT_METHOD, 'EMAIL'),
    message: toText(row.message),
    createdAt: toText(row.createdAt),
    watchId: toText(row.watchId),
    watchSlug: toText(row.watchSlug),
    watchName: toText(row.watchName),
    watchBrand: toText(row.watchBrand),
    messages: asArray(row.messages).map(toMessage),
    notificationAttempts: asArray(row.notificationAttempts).map(toNotificationAttempt),
  };
}

export async function updateInquiryStatus(id: string, status: InquiryStatus): Promise<{ id: string; status: InquiryStatus }> {
  const row = asRecord(
    await requestData<unknown>(`/admin/inquiries/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: { status },
    }),
  );
  return { id: toText(row.id, id), status: toEnum(row.status, INQUIRY_STATUS, status) };
}

/**
 * Sends an administrator reply into the inquiry thread.
 *
 * Two backend side effects matter to the cache, and neither is visible in the
 * response body: the API moves the inquiry to `IN_DISCUSSION`, and — for a
 * registered customer with an email on file — writes an in-app notification row.
 * It also queues an email or WhatsApp notification whose delivery is tracked per
 * attempt on the detail response. Callers must therefore invalidate the inquiry
 * detail AND the list, not merely append the returned message.
 */
export async function replyToInquiry(id: string, body: string): Promise<InquiryMessage> {
  return toMessage(
    await requestData<unknown>(`/admin/inquiries/${encodeURIComponent(id)}/messages`, {
      method: 'POST',
      body: { body },
    }),
  );
}

/**
 * Requeues a definitively failed notification attempt. The API rejects (409)
 * attempts that are accepted, delivered or of unknown outcome, so a resend can
 * never duplicate a message that may already have gone out.
 */
export async function retryNotificationAttempt(inquiryId: string, attemptId: string): Promise<void> {
  await requestData<unknown>(
    `/admin/inquiries/${encodeURIComponent(inquiryId)}/notification-attempts/${encodeURIComponent(attemptId)}/retry`,
    { method: 'POST' },
  );
}

/**
 * Records that the administrator opened the thread: customer messages become
 * read and a NEW inquiry becomes VIEWED. Idempotent on the server.
 */
export async function markInquiryRead(id: string): Promise<void> {
  await requestData<unknown>(`/admin/inquiries/${encodeURIComponent(id)}/read`, { method: 'POST' });
}
