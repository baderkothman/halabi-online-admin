import { describe, expect, it } from 'vitest';
import { availabilityPresentation, getAvailability, requiresConfirmation } from './availability';
import { getInquiryStatus, inquiryStatusPresentation, openInquiryStatuses } from './inquiry-status';
import { INQUIRY_STATUS, WATCH_AVAILABILITY } from '@/types/domain';

/**
 * Status mapping is the one place a missing entry produces a blank chip rather
 * than a crash, so it is worth asserting completeness explicitly.
 */

describe('availability mapping', () => {
  it('covers every backend enum member', () => {
    for (const status of WATCH_AVAILABILITY) {
      expect(availabilityPresentation[status]?.label).toBeTruthy();
    }
  });

  it('offers no transition out of SOLD', () => {
    // Reversing a sale is an accounting correction, not a one-click list action.
    expect(getAvailability('SOLD').allowedTransitions).toHaveLength(0);
  });

  it('never proposes a transition to a state that is not a real enum member', () => {
    for (const status of WATCH_AVAILABILITY) {
      for (const next of availabilityPresentation[status].allowedTransitions) {
        expect(WATCH_AVAILABILITY).toContain(next);
      }
    }
  });

  it('confirms the transitions with lasting consequences', () => {
    expect(requiresConfirmation('SOLD')).toBe(true);
    expect(requiresConfirmation('ARCHIVED')).toBe(true);
    expect(requiresConfirmation('RESERVED')).toBe(false);
  });

  it('degrades to a safe default for a value this build has never seen', () => {
    expect(getAvailability('SOMETHING_NEW' as never).label).toBe('Unavailable');
  });
});

describe('inquiry status mapping', () => {
  it('covers every backend enum member', () => {
    for (const status of INQUIRY_STATUS) {
      expect(inquiryStatusPresentation[status]?.label).toBeTruthy();
    }
  });

  it('treats exactly CLOSED and CONVERTED as finished', () => {
    expect(openInquiryStatuses).not.toContain('CLOSED');
    expect(openInquiryStatuses).not.toContain('CONVERTED');
    expect(openInquiryStatuses).toContain('NEW');
    expect(openInquiryStatuses).toContain('IN_DISCUSSION');
  });

  it('proposes only real enum members as next statuses', () => {
    for (const status of INQUIRY_STATUS) {
      for (const next of inquiryStatusPresentation[status].nextStatuses) {
        expect(INQUIRY_STATUS).toContain(next);
      }
    }
  });

  it('leaves a converted inquiry with nowhere to go', () => {
    expect(getInquiryStatus('CONVERTED').nextStatuses).toHaveLength(0);
  });
});
