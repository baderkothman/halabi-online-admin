import { describe, expect, it, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-opener', () => ({ openUrl: vi.fn().mockResolvedValue(undefined) }));

import { openUrl } from '@tauri-apps/plugin-opener';
import { greetingFor, openWhatsApp, toWhatsAppNumber } from './contact-links';

describe('toWhatsAppNumber', () => {
  it('strips the formatting wa.me cannot accept', () => {
    expect(toWhatsAppNumber('+961 70 123 456')).toBe('96170123456');
    expect(toWhatsAppNumber('(+961) 70-123-456')).toBe('96170123456');
  });

  it('rejects a number too short to be dialable', () => {
    // Opening wa.me with a malformed number lands on an error page, which looks
    // to the operator like the app failed.
    expect(toWhatsAppNumber('12345')).toBeNull();
    expect(toWhatsAppNumber('n/a')).toBeNull();
  });
});

describe('openWhatsApp', () => {
  it('builds an allowlisted wa.me URL with the message encoded', async () => {
    await openWhatsApp('+961 70 123 456', 'Hello Maya');
    expect(openUrl).toHaveBeenCalledWith('https://wa.me/96170123456?text=Hello%20Maya');
  });

  it('refuses rather than opening a broken link', async () => {
    await expect(openWhatsApp('123', 'Hello')).rejects.toThrow(/WhatsApp can open/);
  });
});

describe('greetingFor', () => {
  it('names the customer and the piece, and nothing else', () => {
    const greeting = greetingFor({ customerName: 'Maya Haddad', watchBrand: 'Omega', watchName: 'Seamaster 300' });
    expect(greeting).toContain('Hello Maya Haddad');
    expect(greeting).toContain('Omega Seamaster 300');
  });
});
