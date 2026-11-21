import { useState } from 'react';
import { Box, Button, IconButton, Menu, MenuItem, Stack, Tooltip, Typography } from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { StatusChip } from '@/components/data-display/StatusChip';
import { contactMethodLabels, getInquiryStatus } from '@/config/inquiry-status';
import { greetingFor, openEmail, openPhone, openWhatsApp, toWhatsAppNumber } from '@/lib/contact-links';
import { renderTemplate } from '@/lib/templates';
import { useSettings } from '@/app/settings/settings';
import { formatDateTime } from '@/lib/format';
import type { InquiryDetail, InquiryStatus } from '@/types/domain';

/**
 * The detail pane's header: who asked, about what, and every action.
 *
 * Contact details are ACTIONS rather than copyable text. The workflow this
 * replaces is an administrator highlighting a phone number and pasting it into
 * WhatsApp dozens of times a day; one button that opens the composer with the
 * customer's name and the piece already written is the point of the screen.
 */
export function InquiryHeader({
  inquiry, statusBusy, onChooseStatus, onOpenWatch, onError,
}: {
  inquiry: InquiryDetail;
  statusBusy: boolean;
  onChooseStatus: (next: InquiryStatus) => void;
  onOpenWatch: () => void;
  onError: (message: string) => void;
}) {
  const [statusAnchor, setStatusAnchor] = useState<HTMLElement | null>(null);
  const status = getInquiryStatus(inquiry.status);
  const { templates } = useSettings();
  const greeting = greetingFor(inquiry, templates.whatsappOpening);
  const whatsappReady = inquiry.phone ? toWhatsAppNumber(inquiry.phone) !== null : false;

  /** External actions are fire-and-report: a refused URL must not be silent. */
  const openExternal = (action: () => Promise<void>) => {
    action().catch((error: unknown) => onError(error instanceof Error ? error.message : 'That link could not be opened.'));
  };

  return (
    <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'line.subtle', flexShrink: 0 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} alignItems="flex-start" spacing={2}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="h3" noWrap>
            {inquiry.customerName}
          </Typography>
          <Typography variant="caption" color="ink.muted">
            {/* The admin inquiry projection carries no `customer_id`, so this
                application cannot distinguish a registered customer from a
                guest — see docs/API-INTEGRATION.md. Preferred contact is what
                matters operationally, and that is available. */}
            Prefers {contactMethodLabels[inquiry.preferredContactMethod].toLowerCase()} · Received{' '}
            {formatDateTime(inquiry.createdAt)}
          </Typography>
        </Box>

        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flexShrink: 0, flexWrap: 'wrap', rowGap: 0.75 }}>
          <StatusChip label={status.label} tone={status.tone} />
          {status.nextStatuses.length > 0 && (
            <Button
              size="small"
              variant="outlined"
              onClick={(event) => setStatusAnchor(event.currentTarget)}
              disabled={statusBusy}
              aria-haspopup="menu"
              aria-expanded={statusAnchor ? 'true' : undefined}
            >
              Change status
            </Button>
          )}
        </Stack>
      </Stack>

      <Menu anchorEl={statusAnchor} open={Boolean(statusAnchor)} onClose={() => setStatusAnchor(null)}>
        {status.nextStatuses.map((next) => (
          <MenuItem
            key={next}
            onClick={() => {
              setStatusAnchor(null);
              onChooseStatus(next);
            }}
          >
            Mark {getInquiryStatus(next).label.toLowerCase()}
          </MenuItem>
        ))}
      </Menu>

      <Stack direction="row" spacing={0.75} sx={{ mt: 1.25, flexWrap: 'wrap', rowGap: 0.75 }}>
        {inquiry.phone && (
          <Tooltip title={whatsappReady ? `Open WhatsApp with ${inquiry.phone}` : 'This number cannot be opened in WhatsApp'}>
            {/* A disabled button cannot host a tooltip, so the span carries it. */}
            <span>
              <Button
                size="small"
                variant="outlined"
                disabled={!whatsappReady}
                startIcon={<WhatsAppIcon sx={{ fontSize: 15 }} />}
                onClick={() => openExternal(() => openWhatsApp(inquiry.phone as string, greeting))}
              >
                WhatsApp
              </Button>
            </span>
          </Tooltip>
        )}

        {inquiry.email && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<MailOutlineIcon sx={{ fontSize: 15 }} />}
            onClick={() =>
              openExternal(() =>
                openEmail(
                  inquiry.email as string,
                  renderTemplate(templates.emailSubject, inquiry),
                  renderTemplate(templates.emailBody, inquiry),
                ),
              )
            }
          >
            Email
          </Button>
        )}

        {inquiry.phone && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<PhoneOutlinedIcon sx={{ fontSize: 15 }} />}
            onClick={() => openExternal(() => openPhone(inquiry.phone as string))}
          >
            Call
          </Button>
        )}

        <Box sx={{ flex: 1 }} />

        <Tooltip title="Open this watch in the catalogue">
          <IconButton onClick={onOpenWatch} aria-label="Open this watch in the catalogue">
            <OpenInNewIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' },
          gap: 1.5,
          mt: 1,
        }}
      >
        <Field label="Watch" value={`${inquiry.watchBrand} ${inquiry.watchName}`} />
        {inquiry.email && <Field label="Email" value={inquiry.email} />}
        {inquiry.phone && <Field label="Phone" value={inquiry.phone} />}
      </Box>
    </Box>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        variant="caption"
        color="ink.muted"
        sx={{ display: 'block', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        noWrap
        title={value}
        sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
      >
        {value}
      </Typography>
    </Box>
  );
}
