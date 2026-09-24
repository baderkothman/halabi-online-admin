import { useState } from 'react';
import { Box, CircularProgress, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ErrorState } from '@/components/feedback/ErrorState';
import { InquiryConversation } from './InquiryConversation';
import { InquiryHeader } from './InquiryHeader';
import { InquiryReplyBox } from './InquiryReplyBox';
import { useInquiry, useReplyToInquiry, useUpdateInquiryStatus } from './queries';
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

  const [pendingStatus, setPendingStatus] = useState<InquiryStatus | null>(null);

  if (inquiry.isPending) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', height: '100%' }}>
        <CircularProgress size={20} aria-label="Loading inquiry" />
      </Box>
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
          // The API emails the customer and writes a notification for
          // registered accounts; saying so sets the right expectation.
          notifySuccess(
            data.email ? 'Reply sent. The customer has been notified by email.' : 'Reply saved to the conversation.',
          ),
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

      <InquiryReplyBox
        status={data.status}
        customerHasEmail={Boolean(data.email)}
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
