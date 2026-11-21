import { IconButton, Tooltip } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import { visibilityPresentation } from '@/config/availability';
import type { AdminWatchListItem, WatchWriteInput } from '@/types/domain';

type Patch = (input: Partial<WatchWriteInput>, message: string) => void;

/**
 * The two one-click edits shared by the table row and the grid card. Each
 * `aria-label` states the current state and the action, so the control is
 * usable without seeing the icon.
 */
export function VisibilityToggle({ watch, busy, onPatch }: { watch: AdminWatchListItem; busy: boolean; onPatch: Patch }) {
  const published = watch.visibility === 'PUBLIC';
  return (
    <Tooltip title={visibilityPresentation[watch.visibility].description}>
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
  );
}

export function FeaturedToggle({ watch, busy, onPatch }: { watch: AdminWatchListItem; busy: boolean; onPatch: Patch }) {
  return (
    <Tooltip title={watch.featured ? 'Featured on the storefront home page' : 'Not featured'}>
      <IconButton
        onClick={() => onPatch({ featured: !watch.featured }, watch.featured ? 'is no longer featured.' : 'is now featured.')}
        disabled={busy}
        aria-label={watch.featured ? `Unfeature ${watch.name}` : `Feature ${watch.name}`}
        aria-pressed={watch.featured}
        size="small"
      >
        {watch.featured ? <StarIcon sx={{ fontSize: 17, color: 'statusTone.notice' }} /> : <StarBorderIcon sx={{ fontSize: 17 }} />}
      </IconButton>
    </Tooltip>
  );
}

/** The cover image: the one marked primary, else the first. */
export function coverImage(watch: AdminWatchListItem) {
  return watch.images.find((image) => image.isPrimary) ?? watch.images[0];
}
