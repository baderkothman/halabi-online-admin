import { Box, ButtonBase, Paper, Stack, Typography } from '@mui/material';
import WatchOutlinedIcon from '@mui/icons-material/WatchOutlined';
import { WatchStatusMenu } from './WatchStatusMenu';
import { FeaturedToggle, VisibilityToggle, coverImage } from './WatchToggles';
import { formatPrice } from '@/lib/format';
import type { AdminWatchListItem, WatchAvailability, WatchWriteInput } from '@/types/domain';

/**
 * One piece in the grid view: photography first, then the facts a dealer scans
 * for (model, brand, reference, price), then the same inline edits as the
 * table. The photo and the title open the edit form.
 */
export function WatchCard({
  watch, busy, onPatch, onEdit,
}: {
  watch: AdminWatchListItem;
  busy: boolean;
  onPatch: (input: Partial<WatchWriteInput>, message: string) => void;
  onEdit: () => void;
}) {
  const cover = coverImage(watch);

  return (
    <Paper variant="outlined" component="article" aria-label={`${watch.brand} ${watch.name}`} sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <ButtonBase
        onClick={onEdit}
        aria-label={`Edit ${watch.name}`}
        sx={{ display: 'block', width: '100%', aspectRatio: '4 / 3', bgcolor: 'surfaceTone.sunken', position: 'relative' }}
      >
        {cover ? (
          <Box
            component="img"
            src={cover.url}
            alt={cover.alt ?? ''}
            loading="lazy"
            decoding="async"
            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <Stack alignItems="center" justifyContent="center" spacing={0.5} sx={{ height: '100%', color: 'ink.muted' }}>
            <WatchOutlinedIcon />
            <Typography variant="caption">No photo yet</Typography>
          </Stack>
        )}
      </ButtonBase>

      <Stack spacing={0.25} sx={{ px: 1.5, pt: 1.25, pb: 0.5, minWidth: 0 }}>
        <Typography variant="caption" color="ink.muted" noWrap>
          {watch.brand}
        </Typography>
        <Typography
          variant="subtitle2"
          noWrap
          component="h3"
          title={watch.name}
          onClick={onEdit}
          sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
        >
          {watch.name}
        </Typography>
        <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={1}>
          <Typography variant="caption" color="ink.secondary" noWrap sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {watch.reference ?? 'No reference'}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
            {formatPrice(watch.publicPrice)}
          </Typography>
        </Stack>
      </Stack>

      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ px: 1, pb: 1, pt: 0.5, mt: 'auto' }}>
        <WatchStatusMenu
          availability={watch.availability}
          watchName={watch.name}
          disabled={busy}
          onChange={(next: WatchAvailability) => onPatch({ availability: next }, `marked ${next.toLowerCase()}.`)}
        />
        <Box sx={{ flex: 1 }} />
        <VisibilityToggle watch={watch} busy={busy} onPatch={onPatch} />
        <FeaturedToggle watch={watch} busy={busy} onPatch={onPatch} />
      </Stack>
    </Paper>
  );
}
