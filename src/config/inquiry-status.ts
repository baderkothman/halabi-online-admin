import type { StatusTone } from './availability';
import type { ContactMethod, InquiryStatus, MessageSenderType } from '@/types/domain';

/**
 * Administrator-facing presentation of the inquiry lifecycle.
 *
 * These labels are written from the business's point of view — the storefront
 * shows the same statuses to customers under different names. Both map the same
 * backend enum; neither invents a state.
 *
 * `nextStatuses` is the set offered as one-click actions. It is a workflow
 * convenience, not a constraint: `PATCH /admin/inquiries/:id/status` accepts any
 * value, and the backend remains authoritative.
 */

export interface InquiryStatusPresentation {
  label: string;
  description: string;
  tone: StatusTone;
  /** Statuses offered as direct actions from this one, in menu order. */
  nextStatuses: readonly InquiryStatus[];
  /** Whether this inquiry is still part of the active working queue. */
  isOpen: boolean;
}

export const inquiryStatusPresentation: Record<InquiryStatus, InquiryStatusPresentation> = {
  NEW: {
    label: 'New',
    description: 'Just received. Nobody has looked at it yet.',
    tone: 'info',
    nextStatuses: ['VIEWED', 'CONTACTED', 'CLOSED'],
    isOpen: true,
  },
  VIEWED: {
    label: 'Viewed',
    description: 'Read, but the customer has not been contacted yet.',
    tone: 'notice',
    nextStatuses: ['CONTACTED', 'IN_DISCUSSION', 'CLOSED'],
    isOpen: true,
  },
  CONTACTED: {
    label: 'Contacted',
    description: 'We have reached out to the customer and are awaiting their response.',
    tone: 'notice',
    nextStatuses: ['IN_DISCUSSION', 'WAITING_FOR_CUSTOMER', 'CONVERTED', 'CLOSED'],
    isOpen: true,
  },
  WAITING_FOR_CUSTOMER: {
    label: 'Waiting for customer',
    description: 'The next move is theirs.',
    tone: 'notice',
    nextStatuses: ['IN_DISCUSSION', 'CONVERTED', 'CLOSED'],
    isOpen: true,
  },
  IN_DISCUSSION: {
    label: 'In discussion',
    description: 'An active conversation about a specific piece.',
    tone: 'positive',
    nextStatuses: ['WAITING_FOR_CUSTOMER', 'CONVERTED', 'CLOSED'],
    isOpen: true,
  },
  CLOSED: {
    label: 'Closed',
    description: 'Finished without a sale.',
    tone: 'neutral',
    nextStatuses: ['IN_DISCUSSION'],
    isOpen: false,
  },
  CONVERTED: {
    label: 'Converted',
    description: 'Led to a completed sale.',
    tone: 'positive',
    nextStatuses: [],
    isOpen: false,
  },
};

export function getInquiryStatus(status: InquiryStatus): InquiryStatusPresentation {
  return inquiryStatusPresentation[status] ?? inquiryStatusPresentation.NEW;
}

/**
 * Closing an inquiry or marking it converted ends the working conversation, so
 * both are confirmed. `CONVERTED` in particular is the status the eventual sales
 * record will be reconciled against.
 */
export function requiresConfirmation(next: InquiryStatus): boolean {
  return next === 'CLOSED' || next === 'CONVERTED';
}

/** Statuses that make up the default "needs attention" working queue. */
export const openInquiryStatuses = (Object.keys(inquiryStatusPresentation) as InquiryStatus[]).filter(
  (status) => inquiryStatusPresentation[status].isOpen,
);

/** The same set, for membership tests inside a filter over every inquiry. */
const openStatusSet = new Set<InquiryStatus>(openInquiryStatuses);

export function isOpenStatus(status: InquiryStatus): boolean {
  return openStatusSet.has(status);
}

export const contactMethodLabels: Record<ContactMethod, string> = {
  EMAIL: 'Email',
  WHATSAPP: 'WhatsApp',
  PHONE: 'Phone',
};

export const messageSenderLabels: Record<MessageSenderType, string> = {
  CUSTOMER: 'Customer',
  ADMIN: 'Halabi Online',
  SYSTEM: 'System',
};
