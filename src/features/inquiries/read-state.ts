import type { DashboardSummary, InquiryDetail, InquiryListItem } from '@/types/domain';

/**
 * Read-state rules shared by the detail pane and the caches it updates.
 *
 * Opening an inquiry marks the customer's messages read and moves a NEW inquiry
 * to VIEWED (`POST /admin/inquiries/:id/read`). These helpers apply the same
 * change to cached data straight away, so the list dot, the Unread filter
 * count, the dashboard figure and the sidebar badge all update on open instead
 * of after the next refetch.
 */

/** Whether opening this inquiry has anything to mark. */
export function needsMarkRead(inquiry: Pick<InquiryDetail, 'status' | 'messages'>): boolean {
  return (
    inquiry.status === 'NEW' ||
    inquiry.messages.some((message) => message.senderType === 'CUSTOMER' && message.readAt === null)
  );
}

export function markListItemRead(rows: InquiryListItem[] | undefined, id: string): InquiryListItem[] | undefined {
  if (!rows) return rows;
  let changed = false;
  const next = rows.map((row) => {
    if (row.id !== id || (row.unreadCount === 0 && row.status !== 'NEW')) return row;
    changed = true;
    return { ...row, unreadCount: 0, status: row.status === 'NEW' ? ('VIEWED' as const) : row.status };
  });
  return changed ? next : rows;
}

export function markDetailRead(detail: InquiryDetail | undefined, readAt: string): InquiryDetail | undefined {
  if (!detail) return detail;
  return {
    ...detail,
    status: detail.status === 'NEW' ? 'VIEWED' : detail.status,
    messages: detail.messages.map((message) =>
      message.senderType === 'CUSTOMER' && message.readAt === null ? { ...message, readAt } : message,
    ),
  };
}

/** Opening a NEW inquiry removes it from the "New inquiries" figure and the sidebar badge. */
export function decrementNewInquiries(summary: DashboardSummary | undefined, wasNew: boolean): DashboardSummary | undefined {
  if (!summary || !wasNew) return summary;
  return { ...summary, new_inquiries: Math.max(0, summary.new_inquiries - 1) };
}
