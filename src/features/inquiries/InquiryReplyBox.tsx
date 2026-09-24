import { useState } from 'react';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { getInquiryStatus } from '@/config/inquiry-status';
import type { InquiryStatus } from '@/types/domain';

const MAX_REPLY_LENGTH = 4000;

/**
 * The reply composer, or the reason there is not one.
 *
 * The draft is local to this component and keyed away by the parent when the
 * selected inquiry changes, so a half-written message can never carry from one
 * customer's thread into another's.
 */
export function InquiryReplyBox({
  status, customerHasEmail, sending, onSend, onReopen,
}: {
  status: InquiryStatus;
  customerHasEmail: boolean;
  sending: boolean;
  onSend: (body: string) => void;
  onReopen: (next: InquiryStatus) => void;
}) {
  const [draft, setDraft] = useState('');
  const presentation = getInquiryStatus(status);

  const send = () => {
    const body = draft.trim();
    if (!body) return;
    onSend(body);
    setDraft('');
  };

  if (!presentation.isOpen) {
    const reopenTo = presentation.nextStatuses[0];
    return (
      <Box sx={{ flexShrink: 0, borderTop: 1, borderColor: 'line.subtle', p: 1.5, bgcolor: 'surfaceTone.raised' }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Typography variant="body2" color="ink.muted">
            This inquiry is {presentation.label.toLowerCase()}. {presentation.description}
          </Typography>
          <Box sx={{ flex: 1 }} />
          {reopenTo && (
            <Button size="small" variant="outlined" onClick={() => onReopen(reopenTo)}>
              Reopen
            </Button>
          )}
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ flexShrink: 0, borderTop: 1, borderColor: 'line.subtle', p: 1.5, bgcolor: 'surfaceTone.raised' }}>
      <TextField
        value={draft}
        onChange={(event) => setDraft(event.target.value.slice(0, MAX_REPLY_LENGTH))}
        onKeyDown={(event) => {
          // Cmd/Ctrl+Enter sends. Plain Enter must not: replies here run to
          // paragraphs, and a stray Enter sending a half-written message to a
          // customer is unrecoverable.
          if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
            event.preventDefault();
            send();
          }
        }}
        placeholder="Write a reply to the customer…"
        aria-label="Reply to this inquiry"
        multiline
        minRows={2}
        maxRows={8}
        disabled={sending}
      />

      <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
        <Typography variant="caption" color="ink.muted">
          {customerHasEmail
            ? 'The customer is notified by email when you reply.'
            : 'This customer has no email on file — reply here, then contact them directly.'}
        </Typography>
        <Box sx={{ flex: 1 }} />
        {draft.length > MAX_REPLY_LENGTH - 200 && (
          <Typography variant="caption" color={draft.length >= MAX_REPLY_LENGTH ? 'error.main' : 'ink.muted'}>
            {draft.length} / {MAX_REPLY_LENGTH}
          </Typography>
        )}
        <Button
          variant="contained"
          onClick={send}
          disabled={sending || draft.trim().length === 0}
          startIcon={<SendIcon sx={{ fontSize: 14 }} />}
        >
          {sending ? 'Sending…' : 'Send reply'}
        </Button>
      </Stack>
    </Box>
  );
}
