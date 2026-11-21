import { openUrl } from '@tauri-apps/plugin-opener';
import type { InquiryDetail } from '@/types/domain';
import { DEFAULT_TEMPLATES, renderTemplate } from './templates';

/**
 * External contact actions: WhatsApp, email, phone.
 *
 * Every URL is built here and opened through Tauri's `opener` plugin, whose
 * capability file allows only `https://wa.me/*`, `https://api.whatsapp.com/*`,
 * `mailto:` and `tel:`. A URL assembled anywhere else, or pointing anywhere
 * else, is refused by the Rust side rather than by a code review.
 *
 * Nothing here ever sends a message. Each action opens a composer with the text
 * prefilled, and the administrator sends it — an automatic send to a customer
 * from a background action is not something this application will do.
 */

/**
 * Reduces a phone number to the digits WhatsApp's URL scheme expects.
 *
 * `wa.me` takes an international number with no `+`, spaces or punctuation. A
 * number stored as `+961 70 123 456` becomes `96170123456`.
 */
export function toWhatsAppNumber(phone: string): string | null {
  const digits = phone.replace(/[^\d]/g, '');
  // Shorter than this cannot be a dialable international number, and sending a
  // malformed one opens WhatsApp on an error screen.
  return digits.length >= 7 ? digits : null;
}

/** The opening message. Names the customer and the piece, and nothing more. */
export function greetingFor(
  inquiry: Pick<InquiryDetail, 'customerName' | 'watchName' | 'watchBrand'>,
  template: string = DEFAULT_TEMPLATES.whatsappOpening,
): string {
  return renderTemplate(template, inquiry);
}

export async function openWhatsApp(phone: string, message: string): Promise<void> {
  const number = toWhatsAppNumber(phone);
  if (!number) throw new Error('That phone number is not in a format WhatsApp can open.');
  await openUrl(`https://wa.me/${number}?text=${encodeURIComponent(message)}`);
}

export async function openEmail(email: string, subject: string, body: string): Promise<void> {
  await openUrl(`mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
}

export async function openPhone(phone: string): Promise<void> {
  await openUrl(`tel:${phone.replace(/[^\d+]/g, '')}`);
}
