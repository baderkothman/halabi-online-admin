import { useEffect, useRef, useState } from 'react';
import { Box, Skeleton, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ErrorState } from '@/components/feedback/ErrorState';
import { InquiryConversation } from './InquiryConversation';
import { InquiryHeader } from './InquiryHeader';
import { InquiryNotificationStatus } from './InquiryNotificationStatus';
import { InquiryReplyBox } from './InquiryReplyBox';
import { useInquiry, useMarkInquiryRead, useReplyToInquiry, useRetryNotificationAttempt, useUpdateInquiryStatus } from './queries';
import { needsMarkRead } from './read-state';
import { useSettings } from '@/app/settings/settings';
import { renderTemplate } from '@/lib/templates';
import { getInquiryStatus, requiresConfirmation } from '@/config/inquiry-status';
import { useSnackbar } from '@/app/providers/SnackbarProvider';
import { toDisplayMessage } from '@/services/api';
import { routes } from '@/config/routes';
import type { InquiryStatus } from '@/types/domain';

/**
 * The inbox's right pane.
 *
 * This component owns the data and the two mutations; the header, conversation
 * and reply composer are separate so each stays readable and so the reply
 * draft's state has an obvious home.
 */
export function InquiryDetailPane({ id }: { id: string }) {
  const navigate = useNavigate();
  const { notifySuccess, notifyError } = useSnackbar();
  const inquiry = useInquiry(id);
  const updateStatus = useUpdateInquiryStatus();
  const reply = useReplyToInquiry();
  const retryAttempt = useRetryNotificationAttempt();
  const markRead = useMarkInquiryRead();
  const { templates } = useSettings();

  // Opening an inquiry reads it. Tracked per id so a background refetch, or a
  // new customer message arriving while it is open, does not re-send blindly:
  // it re-marks only when there is something unread again.
  const markedFor = useRef<string | null>(null);
  const { mutate: markReadMutate } = markRead;
  useEffect(() => {
    const data = inquiry.data;
    if (!data || data.id !== id || !needsMarkRead(data)) return;
    const key = `${id}:${data.messages.length}:${data.status}`;
    if (markedFor.current === key) return;
    markedFor.current = key;
    markReadMutate({ id, wasNew: data.status === 'NEW' });
  }, [id, inquiry.data, markReadMutate]);

  const [pendingStatus, setPendingStatus] = useState<InquiryStatus | null>(null);

  if (inquiry.isPending) {
    return (
      <Stack spacing={2} aria-busy="true" aria-label="Loading inquiry" sx={{ height: '100%', p: 2 }}>
        <Skeleton variant="text" width="42%" height={28} />
        <Skeleton variant="text" width="68%" height={18} />
        <Stack direction="row" spacing={1}>
          <Skeleton variant="rounded" width={86} height={32} />
          <Skeleton variant="rounded" width={68} height={32} />
        </Stack>
        <Skeleton variant="rounded" height={96} />
        <Skeleton variant="rounded" height={72} />
      </Stack>
    );
  }

  if (inquiry.isError) {
    return <ErrorState error={inquiry.error} onRetry={() => void inquiry.refetch()} title="Could not load this inquiry" />;
  }

  const data = inquiry.data;

  const applyStatus = (next: InquiryStatus) => {
    updateStatus.mutate(
      { id, status: next },
      {
        onSuccess: () => notifySuccess(`Inquiry marked ${getInquiryStatus(next).label.toLowerCase()}.`),
        onError: (error) => notifyError(toDisplayMessage(error)),
      },
    );
  };

  const retryNotification = (attemptId: string) => {
    retryAttempt.mutate(
      { inquiryId: id, attemptId },
      {
        onSuccess: () => notifySuccess('Notification re-queued.'),
        onError: (error) => notifyError(toDisplayMessage(error)),
      },
    );
  };

  /** Statuses that end the working conversation are confirmed first. */
  const chooseStatus = (next: InquiryStatus) => {
    if (requiresConfirmation(next)) setPendingStatus(next);
    else applyStatus(next);
  };

  const sendReply = (body: string) => {
    reply.mutate(
      { id, body },
      {
        onSuccess: () =>
          // The reply is saved first; delivery happens afterwards and is tracked
          // under "Notification delivery", so do not claim it was delivered.
          notifySuccess('Reply saved. The customer notification is being sent — check delivery status below.'),
        onError: (error) => notifyError(toDisplayMessage(error)),
      },
    );
  };

  return (
    <Stack sx={{ height: '100%', minHeight: 0 }}>
      <InquiryHeader
        inquiry={data}
        statusBusy={updateStatus.isPending}
        onChooseStatus={chooseStatus}
        onOpenWatch={() => void navigate(routes.watches)}
        onError={notifyError}
      />

      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', bgcolor: 'surfaceTone.canvas' }}>
        <InquiryConversation messages={data.messages} />
      </Box>

      <InquiryNotificationStatus
        attempts={data.notificationAttempts}
        retryingId={retryAttempt.isPending ? (retryAttempt.variables?.attemptId ?? null) : null}
        onRetry={retryNotification}
      />

      <InquiryReplyBox
        status={data.status}
        customerHasEmail={Boolean(data.email)}
        quickReplies={templates.quickReplies.map((reply) => ({ id: reply.id, title: reply.title, text: renderTemplate(reply.body, data) }))}
        sending={reply.isPending}
        onSend={sendReply}
        onReopen={applyStatus}
      />

      <ConfirmDialog
        open={pendingStatus !== null}
        title={pendingStatus === 'CONVERTED' ? 'Mark this inquiry as converted?' : 'Close this inquiry?'}
        description={
          pendingStatus === 'CONVERTED'
            ? `This records that ${data.customerName}'s inquiry led to a sale. Mark the watch as sold separately — the API records the two independently.`
            : `${data.customerName}'s inquiry will be closed without a sale and will leave the working queue. You can reopen it later.`
        }
        confirmLabel={pendingStatus === 'CONVERTED' ? 'Mark converted' : 'Close inquiry'}
        onCancel={() => setPendingStatus(null)}
        onConfirm={() => {
          if (pendingStatus) applyStatus(pendingStatus);
          setPendingStatus(null);
        }}
      />
    </Stack>
  );
}
