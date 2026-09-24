import { useMemo, useState } from 'react';
import { isOpenStatus } from '@/config/inquiry-status';
import type { InquiryListItem, InquiryStatus } from '@/types/domain';

/**
 * Scope, status and search for the inbox.
 *
 * Client-side because `GET /admin/inquiries` accepts only a single `status`
 * parameter and returns everything else unpaginated. The scope filter spans
 * several statuses, so it could not use that parameter even if paging existed;
 * the unfiltered list is fetched once and narrowed here. Backend requirements
 * are in docs/API-INTEGRATION.md.
 */

export type InboxScope = 'OPEN' | 'UNREAD' | 'ALL';

export function useInquiryFilters(inquiries: InquiryListItem[] | undefined) {
  const [scope, setScope] = useState<InboxScope>('OPEN');
  const [status, setStatus] = useState<InquiryStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');

  const results = useMemo(() => {
    const all = inquiries ?? [];
    const term = search.trim().toLowerCase();

    return all.filter((inquiry) => {
      if (scope === 'OPEN' && !isOpenStatus(inquiry.status)) return false;
      if (scope === 'UNREAD' && inquiry.unreadCount === 0) return false;
      if (status !== 'ALL' && inquiry.status !== status) return false;
      if (!term) return true;
      // Contact details are searched too: an administrator often has only the
      // number a customer called from.
      return (
        inquiry.customerName.toLowerCase().includes(term) ||
        inquiry.watchName.toLowerCase().includes(term) ||
        inquiry.watchBrand.toLowerCase().includes(term) ||
        (inquiry.email?.toLowerCase().includes(term) ?? false) ||
        (inquiry.phone?.includes(term) ?? false)
      );
    });
  }, [inquiries, scope, status, search]);

  const unreadTotal = useMemo(
    () => (inquiries ?? []).filter((inquiry) => inquiry.unreadCount > 0).length,
    [inquiries],
  );

  const showEverything = () => {
    setScope('ALL');
    setStatus('ALL');
    setSearch('');
  };

  return {
    scope, status, search, results, unreadTotal,
    setScope, setStatus, setSearch, showEverything,
    isFiltered: scope !== 'OPEN' || status !== 'ALL' || search !== '',
  };
}
