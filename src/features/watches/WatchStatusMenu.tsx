import { useState } from 'react';
import { ListItemText, Menu, MenuItem, Typography } from '@mui/material';
import { StatusChip } from '@/components/data-display/StatusChip';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { getAvailability, requiresConfirmation } from '@/config/availability';
import type { WatchAvailability } from '@/types/domain';

/**
 * The availability control: a status chip that opens the legal transitions.
 *
 * Transitions come from `config/availability.ts`, which is the single place the
 * workflow is described. Moves with a lasting consequence — SOLD, ARCHIVED —
 * route through a confirmation that names what will happen.
 */
export function WatchStatusMenu({
  availability,
  watchName,
  disabled = false,
  onChange,
}: {
  availability: WatchAvailability;
  watchName: string;
  disabled?: boolean;
  onChange: (next: WatchAvailability) => void;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [pending, setPending] = useState<WatchAvailability | null>(null);
  const current = getAvailability(availability);
  const transitions = current.allowedTransitions;

  const apply = (next: WatchAvailability) => {
    setAnchor(null);
    if (requiresConfirmation(next)) setPending(next);
    else onChange(next);
  };

  return (
    <>
      <StatusChip
        label={current.label}
        tone={current.tone}
        onClick={disabled || transitions.length === 0 ? undefined : (event) => setAnchor(event.currentTarget)}
        aria-haspopup={transitions.length > 0 ? 'menu' : undefined}
        // A chip with no legal moves is information, not a control, and must
        // not present itself as clickable.
        sx={{ cursor: disabled || transitions.length === 0 ? 'default' : 'pointer' }}
      />

      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        {transitions.map((next) => {
          const presentation = getAvailability(next);
          return (
            <MenuItem key={next} onClick={() => apply(next)} sx={{ alignItems: 'flex-start', py: 0.75 }}>
              <ListItemText
                primary={`Mark ${presentation.label.toLowerCase()}`}
                secondary={presentation.description}
                slotProps={{
                  primary: { fontSize: '0.8125rem', fontWeight: 500 },
                  secondary: { fontSize: '0.6875rem', sx: { maxWidth: 260, whiteSpace: 'normal' } },
                }}
              />
            </MenuItem>
          );
        })}
      </Menu>

      <ConfirmDialog
        open={pending !== null}
        title={pending === 'SOLD' ? 'Mark this watch as sold?' : 'Archive this watch?'}
        description={
          pending === 'SOLD'
            ? `${watchName} will be recorded as sold and will stop accepting inquiries. Availability cannot be changed back from here.`
            : `${watchName} will be removed from the storefront and from the default catalogue list. You can restore it later.`
        }
        confirmLabel={pending === 'SOLD' ? 'Mark sold' : 'Archive'}
        destructive={pending === 'ARCHIVED'}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending) onChange(pending);
          setPending(null);
        }}
      />
    </>
  );
}

/** Renders the consequence text for a status, for use in detail panes. */
export function AvailabilityDescription({ availability }: { availability: WatchAvailability }) {
  return (
    <Typography variant="caption" color="ink.muted">
      {getAvailability(availability).description}
    </Typography>
  );
}
