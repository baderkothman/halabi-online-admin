import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inquiriesApi } from '@/services/api';
import { queryKeys } from '@/services/query-keys';
import type { InquiryStatus } from '@/types/domain';

/**
 * Inquiry queries and mutations.
 *
 * Invalidation is broader here than elsewhere, and deliberately so. Both
 * mutations have backend side effects the response body does not describe:
 *
 * - `PATCH .../status` changes `updated_at`, which is the list's sort order.
 * - `POST .../messages` moves the inquiry to IN_DISCUSSION, writes a
 *   notification row, and may send an email — none of which is in the returned
 *   message object.
 *
 * So both invalidate `inquiries.all` (every filtered list AND the detail) and
 * `dashboard.all` (the NEW and active-discussion counts, which also drive the
 * sidebar badge). Appending to the cache manually would leave the status, the
 * ordering and the badge stale.
 */

export function useInquiries(status?: InquiryStatus) {
  return useQuery({
    queryKey: queryKeys.inquiries.list(status),
    queryFn: ({ signal }) => inquiriesApi.listInquiries(status, signal),
  });
}

export function useInquiry(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.inquiries.detail(id ?? ''),
    queryFn: ({ signal }) => inquiriesApi.getInquiry(id as string, signal),
    enabled: Boolean(id),
  });
}

export function useUpdateInquiryStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: InquiryStatus }) =>
      inquiriesApi.updateInquiryStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.inquiries.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

export function useReplyToInquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) => inquiriesApi.replyToInquiry(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.inquiries.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}
