import { useRef } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { StatusChip } from '@/components/data-display/StatusChip';
import { getInquiryStatus } from '@/config/inquiry-status';
import { formatRelative } from '@/lib/format';
import type { InquiryListItem } from '@/types/domain';

/**
 * The inbox's left pane.
 *
 * Rows are buttons in a listbox rather than links, because selecting one
 * changes the right pane in place — the URL still updates, so a row is
 * addressable, but the interaction is selection, not navigation.
 */
export function InquiryList({
  inquiries,
  selectedId,
  onSelect,
}: {
  inquiries: InquiryListItem[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
}) {
  const optionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const focusId = selectedId && inquiries.some((inquiry) => inquiry.id === selectedId)
    ? selectedId
    : inquiries[0]?.id;

  const handleKeyDown = (event: React.KeyboardEvent, index: number, id: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(id);
      return;
    }

    let nextIndex = index;
    if (event.key === 'ArrowDown') nextIndex = Math.min(index + 1, inquiries.length - 1);
    if (event.key === 'ArrowUp') nextIndex = Math.max(index - 1, 0);
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = inquiries.length - 1;
    if (nextIndex === index) return;

    event.preventDefault();
    const next = inquiries[nextIndex];
    if (!next) return;
    optionRefs.current[next.id]?.focus();
    onSelect(next.id);
  };

  return (
    <Box role="listbox" aria-label="Inquiries" tabIndex={-1}>
      {inquiries.map((inquiry, index) => {
        const status = getInquiryStatus(inquiry.status);
        const selected = inquiry.id === selectedId;
        const unread = inquiry.unreadCount > 0;

        return (
          <Box
            key={inquiry.id}
            role="option"
            aria-selected={selected}
            aria-setsize={inquiries.length}
            aria-posinset={index + 1}
            tabIndex={inquiry.id === focusId ? 0 : -1}
            ref={(node: HTMLDivElement | null) => {
              optionRefs.current[inquiry.id] = node;
            }}
            onClick={() => onSelect(inquiry.id)}
            onKeyDown={(event) => handleKeyDown(event, index, inquiry.id)}
            sx={{
              px: 1.5, py: 1.125, cursor: 'pointer',
              borderBottom: 1, borderColor: 'line.subtle',
              // The selected row is marked by a left rule as well as a tint, so
              // it survives at low contrast and in greyscale.
              borderLeft: 2,
              borderLeftColor: selected ? 'secondary.main' : 'transparent',
              bgcolor: selected ? 'surfaceTone.sunken' : 'transparent',
              '&:hover': { bgcolor: 'surfaceTone.sunken' },
              '&:focus-visible': { outline: 2, outlineColor: 'secondary.main', outlineOffset: -2 },
            }}
          >
            <Stack direction="row" alignItems="baseline" spacing={0.75}>
              {unread && (
                <Box
                  component="span"
                  role="img"
                  aria-label={`${inquiry.unreadCount} unread ${inquiry.unreadCount === 1 ? 'message' : 'messages'}`}
                  sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'error.main', flexShrink: 0, alignSelf: 'center' }}
                />
              )}
              <Typography variant="subtitle2" noWrap sx={{ flex: 1, fontWeight: unread ? 600 : 500 }}>
                {inquiry.customerName}
              </Typography>
              <Typography variant="caption" color="ink.muted" sx={{ flexShrink: 0 }}>
                {formatRelative(inquiry.createdAt)}
              </Typography>
            </Stack>

            <Typography variant="caption" color="ink.secondary" noWrap sx={{ display: 'block', mt: 0.125 }}>
              {inquiry.watchBrand} {inquiry.watchName}
            </Typography>

            <Box sx={{ mt: 0.625 }}>
              <StatusChip label={status.label} tone={status.tone} />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
