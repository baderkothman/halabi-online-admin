import { Alert, Box, Button, Chip, Stack, Typography } from '@mui/material';
import { formatDateTime } from '@/lib/format';
import type { NotificationAttempt, NotificationStatus } from '@/types/domain';

const STATUS_LABEL: Record<NotificationStatus, string> = {
  QUEUED: 'Queued',
  SENDING: 'Sending',
  ACCEPTED: 'Sent to provider',
  DELIVERED: 'Delivered',
  FAILED: 'Failed',
  UNKNOWN: 'Outcome unknown',
};

const STATUS_COLOR: Record<NotificationStatus, 'default' | 'success' | 'error' | 'warning'> = {
  QUEUED: 'default',
  SENDING: 'default',
  ACCEPTED: 'default',
  DELIVERED: 'success',
  FAILED: 'error',
  UNKNOWN: 'warning',
};

const CHANNEL_LABEL = { EMAIL: 'Email', WHATSAPP: 'WhatsApp' } as const;

interface Props {
  attempts: NotificationAttempt[];
  retryingId: string | null;
  onRetry: (attemptId: string) => void;
}

/**
 * Delivery status of the email / WhatsApp notifications tied to this inquiry.
 *
 * Failures and unknown outcomes are surfaced prominently so staff can follow up.
 * Retry is offered only for definitive failures; an "unknown" WhatsApp send may
 * already have reached the recipient, so it is never resent from here.
 */
export function InquiryNotificationStatus({ attempts, retryingId, onRetry }: Props) {
  if (attempts.length === 0) return null;
  const needsAttention = attempts.some((a) => a.status === 'FAILED' || a.status === 'UNKNOWN');

  return (
    <Box
      component="section"
      aria-label="Notification delivery"
      sx={{ px: 1.5, py: 1, borderTop: 1, borderColor: 'divider' }}
    >
      <Typography variant="caption" sx={{ fontWeight: 600, color: 'ink.secondary' }}>
        Notification delivery
      </Typography>
      {needsAttention && (
        <Alert severity="warning" sx={{ my: 0.75, py: 0 }}>
          Some notifications did not complete. The inquiry itself is saved; follow up manually where needed.
        </Alert>
      )}
      <Stack spacing={0.5} sx={{ mt: 0.5 }} component="ul" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {attempts.map((attempt) => (
          <Stack key={attempt.id} component="li" direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Chip size="small" label={STATUS_LABEL[attempt.status]} color={STATUS_COLOR[attempt.status]} />
            <Typography variant="caption">
              {CHANNEL_LABEL[attempt.channel]} · {attempt.eventType === 'INQUIRY_CREATED' ? 'Staff alert' : 'Customer reply'} · {attempt.recipientLabel}
            </Typography>
            <Typography variant="caption" color="ink.muted">
              {formatDateTime(attempt.updatedAt)}
            </Typography>
            {attempt.lastError && (attempt.status === 'FAILED' || attempt.status === 'UNKNOWN') && (
              <Typography variant="caption" color="ink.muted" sx={{ flexBasis: '100%' }}>
                {attempt.lastError}
              </Typography>
            )}
            {attempt.retryable && (
              <Button
                size="small"
                disabled={retryingId === attempt.id}
                onClick={() => onRetry(attempt.id)}
                aria-label={`Retry ${CHANNEL_LABEL[attempt.channel]} notification to ${attempt.recipientLabel}`}
              >
                {retryingId === attempt.id ? 'Retrying…' : 'Retry'}
              </Button>
            )}
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
