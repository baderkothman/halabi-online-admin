import { z } from 'zod';
import { WATCH_AVAILABILITY, WATCH_VISIBILITY } from '@/types/domain';

/**
 * Validation for the watch form.
 *
 * These rules mirror the API's `CreateWatchDto` — `slug`, `name` and `brand`
 * required, price non-negative — and add the slug format the database's unique
 * index implies. The backend re-validates everything; this exists to give
 * immediate, field-level feedback rather than to be the authority.
 */

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value === '' ? undefined : value))
  .optional();

export const watchSchema = z.object({
  name: z.string().trim().min(1, 'A name is required.').max(200, 'Keep the name under 200 characters.'),
  brand: z.string().trim().min(1, 'A brand is required.').max(120, 'Keep the brand under 120 characters.'),
  slug: z
    .string()
    .trim()
    .min(1, 'A slug is required.')
    .max(200)
    // The storefront builds its URLs from this, and the column is unique.
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and single hyphens.'),
  reference: optionalText,
  description: optionalText,
  publicPrice: z
    .union([z.string(), z.number()])
    .transform((value) => (value === '' || value === null ? undefined : Number(value)))
    .refine((value) => value === undefined || (Number.isFinite(value) && value >= 0), 'Enter a price of zero or more.')
    .optional(),
  condition: optionalText,
  movement: optionalText,
  caseMaterial: optionalText,
  dialColor: optionalText,
  categoryId: optionalText,
  availability: z.enum(WATCH_AVAILABILITY),
  visibility: z.enum(WATCH_VISIBILITY),
  featured: z.boolean(),
});

export type WatchFormValues = z.input<typeof watchSchema>;
export type WatchFormOutput = z.output<typeof watchSchema>;

/**
 * Derives a URL slug from the brand and name.
 *
 * Offered as a convenience on the create form only. It never overwrites a slug
 * the operator has edited, and it is never applied on update: changing a slug
 * breaks every existing storefront link to the piece.
 */
export function suggestSlug(brand: string, name: string): string {
  return `${brand} ${name}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
}
