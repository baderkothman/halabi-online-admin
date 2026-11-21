import { describe, expect, it } from 'vitest';
import { decrementNewInquiries, markDetailRead, markListItemRead, needsMarkRead } from './read-state';
import type { InquiryDetail, InquiryListItem, InquiryMessage } from '@/types/domain';

const message = (overrides: Partial<InquiryMessage>): InquiryMessage => ({
  id: 'm1', senderType: 'CUSTOMER', body: 'Hello', createdAt: '2026-11-21T10:00:00Z', readAt: null, ...overrides,
});

const detail = (overrides: Partial<InquiryDetail>): InquiryDetail => ({
  id: 'i1', status: 'NEW', customerName: 'Maya', email: null, phone: null, preferredContactMethod: 'EMAIL',
  message: 'Hello', createdAt: '2026-11-21T10:00:00Z', watchId: 'w1', watchSlug: 'w', watchName: 'Seamaster',
  watchBrand: 'Omega', messages: [message({})], notificationAttempts: [], ...overrides,
});

const row = (overrides: Partial<InquiryListItem>): InquiryListItem => ({
  id: 'i1', customerName: 'Maya', email: null, phone: null, status: 'NEW', createdAt: '2026-11-21T10:00:00Z',
  watchSlug: 'w', watchName: 'Seamaster', watchBrand: 'Omega', unreadCount: 2, ...overrides,
});

describe('needsMarkRead', () => {
  it('is true for a NEW inquiry or an unread customer message', () => {
    expect(needsMarkRead(detail({}))).toBe(true);
    expect(needsMarkRead(detail({ status: 'IN_DISCUSSION' }))).toBe(true);
  });

  it('is false once everything from the customer has been read', () => {
    expect(needsMarkRead(detail({ status: 'VIEWED', messages: [message({ readAt: '2026-11-21T11:00:00Z' })] }))).toBe(false);
  });

  it('ignores unread administrator messages', () => {
    expect(needsMarkRead(detail({ status: 'VIEWED', messages: [message({ senderType: 'ADMIN' })] }))).toBe(false);
  });
});

describe('markListItemRead', () => {
  it('clears the unread count and moves NEW to VIEWED for that inquiry only', () => {
    const rows = [row({}), row({ id: 'i2', unreadCount: 1, status: 'IN_DISCUSSION' })];
    const next = markListItemRead(rows, 'i1');
    expect(next?.[0]).toMatchObject({ unreadCount: 0, status: 'VIEWED' });
    expect(next?.[1]).toBe(rows[1]);
  });

  it('keeps other statuses', () => {
    expect(markListItemRead([row({ status: 'IN_DISCUSSION' })], 'i1')?.[0]?.status).toBe('IN_DISCUSSION');
  });

  it('returns the same array when nothing changes, so React Query skips a re-render', () => {
    const rows = [row({ unreadCount: 0, status: 'VIEWED' })];
    expect(markListItemRead(rows, 'i1')).toBe(rows);
    expect(markListItemRead(undefined, 'i1')).toBeUndefined();
  });
});

describe('markDetailRead', () => {
  it('stamps unread customer messages and leaves the rest', () => {
    const read = markDetailRead(
      detail({ messages: [message({}), message({ id: 'm2', senderType: 'ADMIN' }), message({ id: 'm3', readAt: 'earlier' })] }),
      'now',
    );
    expect(read?.status).toBe('VIEWED');
    expect(read?.messages.map((m) => m.readAt)).toEqual(['now', null, 'earlier']);
  });
});

describe('decrementNewInquiries', () => {
  const summary = { available: 3, sold: 1, new_inquiries: 2, active_discussions: 1 };

  it('decrements only when the opened inquiry was NEW, never below zero', () => {
    expect(decrementNewInquiries(summary, true)?.new_inquiries).toBe(1);
    expect(decrementNewInquiries(summary, false)).toBe(summary);
    expect(decrementNewInquiries({ ...summary, new_inquiries: 0 }, true)?.new_inquiries).toBe(0);
  });
});
