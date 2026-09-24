import { Button, IconButton, TableCell, TableRow, Tooltip, Typography } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import { WatchStatusMenu } from './WatchStatusMenu';
import { visibilityPresentation } from '@/config/availability';
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
  const visibility = visibilityPresentation[watch.visibility];
  const published = watch.visibility === 'PUBLIC';

  return (
    <TableRow hover>
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
        <Tooltip title={visibility.description}>
          <IconButton
            onClick={() =>
              onPatch(
                { visibility: published ? 'PRIVATE' : 'PUBLIC' },
                published ? 'is no longer on the storefront.' : 'is now on the storefront.',
              )
            }
            disabled={busy}
            aria-label={published ? `Unpublish ${watch.name}` : `Publish ${watch.name}`}
            size="small"
          >
            {published ? (
              <VisibilityOutlinedIcon sx={{ fontSize: 17, color: 'statusTone.positive' }} />
            ) : (
              <VisibilityOffOutlinedIcon sx={{ fontSize: 17 }} />
            )}
          </IconButton>
        </Tooltip>
      </TableCell>

      <TableCell align="center">
        <IconButton
          onClick={() =>
            onPatch(
              { featured: !watch.featured },
              watch.featured ? 'is no longer featured.' : 'is now featured.',
            )
          }
          disabled={busy}
          aria-label={watch.featured ? `Unfeature ${watch.name}` : `Feature ${watch.name}`}
          aria-pressed={watch.featured}
          size="small"
        >
          {watch.featured ? (
            <StarIcon sx={{ fontSize: 17, color: 'statusTone.notice' }} />
          ) : (
            <StarBorderIcon sx={{ fontSize: 17 }} />
          )}
        </IconButton>
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
