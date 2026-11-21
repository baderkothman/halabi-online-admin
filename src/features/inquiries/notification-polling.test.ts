import { describe, expect, it } from 'vitest';
import { notificationRefetchInterval } from './notification-polling';
import type { NotificationAttempt } from '@/types/domain';

const NOW = Date.parse('2026-11-21T12:00:00Z');

function attempt(overrides: Partial<NotificationAttempt>): NotificationAttempt {
  return {
    id: 'a1',
    eventType: 'INQUIRY_CREATED',
    channel: 'EMAIL',
    recipientLabel: 'h***@gmail.com',
    status: 'DELIVERED',
    attemptCount: 1,
    lastError: null,
    createdAt: '2026-11-21T11:59:50Z',
    updatedAt: '2026-11-21T11:59:50Z',
    retryable: false,
    ...overrides,
  };
}

const poll = (...attempts: NotificationAttempt[]) => notificationRefetchInterval({ notificationAttempts: attempts }, NOW);

describe('notificationRefetchInterval', () => {
  it('does not poll without data or attempts', () => {
    expect(notificationRefetchInterval(undefined, NOW)).toBe(false);
    expect(poll()).toBe(false);
  });

  it('polls quickly while an attempt is queued or sending', () => {
    expect(poll(attempt({ status: 'QUEUED' }))).toBe(3_000);
    expect(poll(attempt({ status: 'SENDING', channel: 'WHATSAPP' }))).toBe(3_000);
  });

  it('polls an email waiting for its delivery event, but not WhatsApp', () => {
    expect(poll(attempt({ status: 'ACCEPTED' }))).toBe(5_000);
    expect(poll(attempt({ status: 'ACCEPTED', channel: 'WHATSAPP' }))).toBe(false);
  });

  it('prefers the faster interval when both kinds are present', () => {
    expect(poll(attempt({ status: 'ACCEPTED' }), attempt({ id: 'a2', status: 'QUEUED' }))).toBe(3_000);
  });

  it('stops once everything has settled', () => {
    expect(poll(attempt({ status: 'DELIVERED' }), attempt({ id: 'a2', status: 'FAILED' }), attempt({ id: 'a3', status: 'UNKNOWN' }))).toBe(false);
  });

  it('gives up on attempts that have not changed for two minutes', () => {
    expect(poll(attempt({ status: 'QUEUED', updatedAt: '2026-11-21T11:57:00Z' }))).toBe(false);
    expect(poll(attempt({ status: 'ACCEPTED', updatedAt: '2026-11-21T11:57:00Z' }))).toBe(false);
  });
});
