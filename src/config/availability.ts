import type { WatchAvailability, WatchVisibility } from '@/types/domain';

/**
 * The single source of truth for how watch availability is labelled, coloured
 * and acted upon.
 *
 * Availability is a STATE, never a quantity — Halabi Online sells individual
 * pieces, so nothing in this application may ever express a stock count.
 *
 * `allowedTransitions` mirrors what the business workflow permits, not what the
 * API technically accepts: `PATCH /admin/dashboard/watches/:id` will set any
 * enum value. The restriction exists so the UI cannot suggest a move that makes
 * no operational sense (un-selling a watch, for one), and the backend stays
 * authoritative regardless.
 */

export type StatusTone = 'positive' | 'notice' | 'danger' | 'info' | 'neutral';

export interface AvailabilityPresentation {
  label: string;
  /** Shown in menus and confirmations to explain the consequence of the state. */
  description: string;
  tone: StatusTone;
  /** States an administrator may move a watch into from this one. */
  allowedTransitions: readonly WatchAvailability[];
  /** Whether a watch in this state can still receive customer inquiries. */
  acceptsInquiries: boolean;
}

export const availabilityPresentation: Record<WatchAvailability, AvailabilityPresentation> = {
  AVAILABLE: {
    label: 'Available',
    description: 'Listed and open to inquiries.',
    tone: 'positive',
    allowedTransitions: ['RESERVED', 'UNAVAILABLE', 'ARCHIVED'],
    acceptsInquiries: true,
  },
  RESERVED: {
    label: 'Reserved',
    description: 'Held for a specific customer while a sale is being arranged. Still visible, still open to inquiries.',
    tone: 'notice',
    allowedTransitions: ['AVAILABLE', 'SOLD', 'UNAVAILABLE'],
    acceptsInquiries: true,
  },
  SOLD: {
    label: 'Sold',
    description: 'The piece has been sold. This is recorded against the watch and cannot be reversed from here.',
    tone: 'neutral',
    // Deliberately empty: reversing a sale is an accounting correction, not a
    // status toggle, and must not be a one-click action in a list.
    allowedTransitions: [],
    acceptsInquiries: false,
  },
  UNAVAILABLE: {
    label: 'Unavailable',
    description: 'Temporarily off the market — at service, on consignment elsewhere, or otherwise not sellable.',
    tone: 'neutral',
    allowedTransitions: ['AVAILABLE', 'ARCHIVED'],
    acceptsInquiries: false,
  },
  ARCHIVED: {
    label: 'Archived',
    description: 'Removed from the working catalogue. Hidden from the storefront and from default admin lists.',
    tone: 'neutral',
    allowedTransitions: ['AVAILABLE'],
    acceptsInquiries: false,
  },
};

export function getAvailability(status: WatchAvailability): AvailabilityPresentation {
  return availabilityPresentation[status] ?? availabilityPresentation.UNAVAILABLE;
}

/**
 * Moving a watch to SOLD or ARCHIVED changes what customers see and what the
 * finance record will eventually say, so both require an explicit confirmation
 * that names the consequence.
 */
export function requiresConfirmation(next: WatchAvailability): boolean {
  return next === 'SOLD' || next === 'ARCHIVED';
}

export const visibilityPresentation: Record<WatchVisibility, { label: string; description: string; tone: StatusTone }> = {
  PUBLIC: {
    label: 'Published',
    description: 'Visible on the storefront and reachable by customers.',
    tone: 'positive',
  },
  PRIVATE: {
    label: 'Unpublished',
    description: 'Held back from the storefront. Customers cannot see it or inquire about it.',
    tone: 'neutral',
  },
};
