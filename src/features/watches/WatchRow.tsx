import { Box, Button, TableCell, TableRow, Typography } from '@mui/material';
import WatchOutlinedIcon from '@mui/icons-material/WatchOutlined';
import { WatchStatusMenu } from './WatchStatusMenu';
import { FeaturedToggle, VisibilityToggle, coverImage } from './WatchToggles';
import { formatDate, formatPrice } from '@/lib/format';
import type { AdminWatchListItem, WatchAvailability, WatchWriteInput } from '@/types/domain';

/**
 * One row of the catalogue.
 *
 * Availability, storefront visibility and featured are editable here rather
 * than behind the edit form: they are the three changes an administrator makes
 * dozens of times a day, and opening a form for each would be the wrong shape.
 *
 * Every icon control carries an `aria-label` that states both the current state
 * and the action, so the row is usable without seeing the icon.
 */
export function WatchRow({
  watch, busy, onPatch, onEdit,
}: {
  watch: AdminWatchListItem;
  busy: boolean;
  onPatch: (input: Partial<WatchWriteInput>, message: string) => void;
  onEdit: () => void;
}) {
  const cover = coverImage(watch);

  return (
    <TableRow hover>
      <TableCell padding="checkbox">
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1,
            border: 1,
            borderColor: 'line.subtle',
            bgcolor: 'background.paper',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {cover ? (
            <Box component="img" src={cover.url} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <WatchOutlinedIcon fontSize="small" sx={{ color: 'ink.muted' }} />
          )}
        </Box>
      </TableCell>
      <TableCell sx={{ maxWidth: 320 }}>
        <Typography variant="subtitle2" noWrap>
          {watch.name}
        </Typography>
        <Typography variant="caption" color="ink.muted" noWrap sx={{ display: 'block' }}>
          {watch.brand}
        </Typography>
      </TableCell>

      <TableCell sx={{ color: 'ink.secondary', fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem' }}>
        {watch.reference ?? '—'}
      </TableCell>

      <TableCell align="right">{formatPrice(watch.publicPrice)}</TableCell>

      <TableCell>
        <WatchStatusMenu
          availability={watch.availability}
          watchName={watch.name}
          disabled={busy}
          onChange={(next: WatchAvailability) => onPatch({ availability: next }, `marked ${next.toLowerCase()}.`)}
        />
      </TableCell>

      <TableCell>
        <VisibilityToggle watch={watch} busy={busy} onPatch={onPatch} />
      </TableCell>

      <TableCell align="center">
        <FeaturedToggle watch={watch} busy={busy} onPatch={onPatch} />
      </TableCell>

      <TableCell sx={{ color: 'ink.muted', whiteSpace: 'nowrap' }}>{formatDate(watch.createdAt)}</TableCell>

      <TableCell align="right">
        <Button size="small" variant="text" onClick={onEdit}>
          Edit
        </Button>
      </TableCell>
    </TableRow>
  );
}
