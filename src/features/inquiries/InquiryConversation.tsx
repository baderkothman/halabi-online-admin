import { useEffect, useRef } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { messageSenderLabels } from '@/config/inquiry-status';
import { formatDateTime } from '@/lib/format';
import type { InquiryMessage } from '@/types/domain';

/**
 * The message thread.
 *
 * Customer messages sit left on a plain surface; administrator replies sit
 * right on a tinted one. Every message is rendered as TEXT — never as HTML —
 * because the body is customer-supplied and arrives from the API as an
 * untrusted string. React escapes it by default and nothing here undoes that.
 */
export function InquiryConversation({ messages }: { messages: InquiryMessage[] }) {
  const endRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view as the thread grows. `auto` rather than
  // `smooth` on mount, so opening an inquiry does not animate a long scroll.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  return (
    <Stack spacing={1.25} sx={{ p: 1.5 }}>
      {messages.map((message) => {
        const fromAdmin = message.senderType === 'ADMIN';
        const isSystem = message.senderType === 'SYSTEM';

        if (isSystem) {
          return (
            <Typography key={message.id} variant="caption" color="ink.muted" sx={{ textAlign: 'center', py: 0.5 }}>
              {message.body}
            </Typography>
          );
        }

        return (
          <Box
            key={message.id}
            sx={{
              alignSelf: fromAdmin ? 'flex-end' : 'flex-start',
              maxWidth: '78%',
              minWidth: 160,
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              alignItems="baseline"
              justifyContent={fromAdmin ? 'flex-end' : 'flex-start'}
              sx={{ mb: 0.375 }}
            >
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'ink.secondary' }}>
                {messageSenderLabels[message.senderType]}
              </Typography>
              <Typography variant="caption" color="ink.muted" sx={{ fontSize: 10 }}>
                {formatDateTime(message.createdAt)}
              </Typography>
            </Stack>

            <Box
              sx={{
                px: 1.25, py: 1,
                borderRadius: 1,
                border: 1,
                borderColor: fromAdmin ? 'transparent' : 'line.subtle',
                bgcolor: fromAdmin ? 'statusTone.infoSubtle' : 'surfaceTone.raised',
              }}
            >
              <Typography
                variant="body2"
                // Customers type in paragraphs; collapsing their line breaks
                // makes a long message unreadable.
                sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
              >
                {message.body}
              </Typography>
            </Box>
          </Box>
        );
      })}
      <div ref={endRef} />
    </Stack>
  );
}
