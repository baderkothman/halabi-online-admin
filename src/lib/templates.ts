import type { InquiryDetail } from '@/types/domain';

/**
 * Message templates: plain text with `{placeholder}` fields filled from the
 * inquiry. Only the names below are replaced; anything else in braces is left
 * exactly as written, so a typo shows up in the composer instead of vanishing.
 */

/** Built-in templates. The opening matches the wording the app always used. */
export const DEFAULT_TEMPLATES = {
  whatsappOpening: "Hello {customerName},\n\nI'm contacting you from Halabi Online regarding your inquiry about the {watch}.",
  emailSubject: 'Your inquiry about the {watch}',
  emailBody: "Hello {customerName},\n\nI'm contacting you from Halabi Online regarding your inquiry about the {watch}.",
  quickReplies: [
    { id: 'available', title: 'Still available', body: 'Thank you for your interest. The {watch} is still available. Would you like more photos or details?' },
    { id: 'viewing', title: 'Arrange a viewing', body: 'We would be happy to arrange a viewing of the {watch}. Which day and time suit you?' },
    { id: 'sold', title: 'No longer available', body: 'Thank you for asking about the {watch}. Unfortunately it is no longer available. We can let you know when a similar piece arrives.' },
  ],
};

export type TemplateContext = Pick<InquiryDetail, 'customerName' | 'watchName' | 'watchBrand'>;

export const TEMPLATE_VARIABLES = [
  { name: 'customerName', description: "Customer's name" },
  { name: 'watch', description: 'Brand and model, e.g. Omega Seamaster 300' },
  { name: 'watchBrand', description: 'Brand only' },
  { name: 'watchName', description: 'Model only' },
] as const;

export function renderTemplate(template: string, context: TemplateContext): string {
  const values: Record<string, string> = {
    customerName: context.customerName,
    watch: [context.watchBrand, context.watchName].filter(Boolean).join(' '),
    watchBrand: context.watchBrand,
    watchName: context.watchName,
  };
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => values[name] ?? whole);
}

/** Placeholders a template uses that are not supported, for inline warnings in Settings. */
export function unknownPlaceholders(template: string): string[] {
  const known = new Set<string>(TEMPLATE_VARIABLES.map((variable) => variable.name));
  return [...new Set([...template.matchAll(/\{(\w+)\}/g)].map((match) => match[1] as string))].filter((name) => !known.has(name));
}
