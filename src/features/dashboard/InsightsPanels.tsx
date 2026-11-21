import { Box, Link, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Panel } from '@/components/common/Panel';
import { BarChart } from '@/components/data-display/BarChart';
import { getInquiryStatus } from '@/config/inquiry-status';
import { routes } from '@/config/routes';
import type { DashboardInsights } from './insights';

const dayFormat = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' });

function dayLabel(day: string): string {
  const [year, month, date] = day.split('-').map(Number) as [number, number, number];
  return dayFormat.format(new Date(year, month - 1, date));
}

/** "+3 vs previous 30 days", stated in words so it does not rely on colour. */
function changeText(current: number, previous: number): string {
  if (previous === 0) return current === 0 ? 'None in the previous 30 days either' : 'None in the previous 30 days';
  const difference = current - previous;
  if (difference === 0) return 'Same as the previous 30 days';
  return `${difference > 0 ? '+' : ''}${difference} vs the previous 30 days (${previous})`;
}

export function InquiryTrendPanel({ insights }: { insights: DashboardInsights }) {
  return (
    <Panel title="Inquiries, last 30 days">
      <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mb: 1.5 }}>
        <Typography sx={{ fontSize: 22, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{insights.last30}</Typography>
        <Typography variant="caption" color="ink.muted">
          {changeText(insights.last30, insights.previous30)}
        </Typography>
      </Stack>
      <BarChart
        caption="Inquiries per day, last 30 days"
        data={insights.trend.map((entry) => ({ key: entry.day, label: dayLabel(entry.day), value: entry.count }))}
      />
    </Panel>
  );
}

export function PipelinePanel({ insights }: { insights: DashboardInsights }) {
  const max = Math.max(1, ...insights.pipeline.map((entry) => entry.count));
  return (
    <Panel title="Pipeline">
      <Stack spacing={1}>
        {insights.pipeline.map((entry) => {
          const status = getInquiryStatus(entry.status);
          return (
            <Box key={entry.status}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">{status.label}</Typography>
                <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>{entry.count}</Typography>
              </Stack>
              <Box aria-hidden sx={{ height: 4, bgcolor: 'surfaceTone.sunken', borderRadius: 2, mt: 0.5, overflow: 'hidden' }}>
                <Box sx={{ height: '100%', width: `${(entry.count / max) * 100}%`, bgcolor: 'ink.muted' }} />
              </Box>
            </Box>
          );
        })}
        <Typography variant="caption" color="ink.muted" sx={{ pt: 0.5 }}>
          {insights.conversionRate === null
            ? 'Conversion rate appears once inquiries are closed or converted.'
            : `${Math.round(insights.conversionRate * 100)}% of ${insights.resolved} resolved inquiries led to a sale.`}
        </Typography>
      </Stack>
    </Panel>
  );
}

export function TopWatchesPanel({ insights }: { insights: DashboardInsights }) {
  return (
    <Panel title="Most inquired watches">
      {insights.topWatches.length === 0 ? (
        <Typography variant="body2" color="ink.muted">No inquiries yet.</Typography>
      ) : (
        <Stack component="ol" spacing={0.75} sx={{ m: 0, pl: 2.25 }}>
          {insights.topWatches.map((watch) => (
            <Typography key={`${watch.slug}-${watch.name}`} component="li" variant="body2">
              <Stack direction="row" justifyContent="space-between" spacing={1}>
                <Typography variant="body2" noWrap component="span">
                  {watch.brand} {watch.name}
                </Typography>
                <Typography variant="body2" color="ink.muted" component="span" sx={{ flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                  {watch.count} {watch.count === 1 ? 'inquiry' : 'inquiries'}
                </Typography>
              </Stack>
            </Typography>
          ))}
        </Stack>
      )}
    </Panel>
  );
}

/** Catalogue work that blocks sales, each linking straight to the piece to fix. */
export function AttentionPanel({ insights }: { insights: DashboardInsights }) {
  const groups = [
    { key: 'unpublished', label: 'Available but not on the storefront', items: insights.attention.unpublished },
    { key: 'noPhoto', label: 'No photos', items: insights.attention.noPhoto },
    { key: 'noPrice', label: 'No price shown', items: insights.attention.noPrice },
  ].filter((group) => group.items.length > 0);

  return (
    <Panel title="Needs attention">
      {groups.length === 0 ? (
        <Typography variant="body2" color="ink.muted">
          Every piece for sale is published, priced and photographed.
        </Typography>
      ) : (
        <Stack spacing={1.25}>
          {groups.map((group) => (
            <Box key={group.key}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {group.label} ({group.items.length})
              </Typography>
              <Stack component="ul" spacing={0.25} sx={{ m: 0, mt: 0.25, pl: 2.25 }}>
                {group.items.slice(0, 3).map((item) => (
                  <Typography key={item.id} component="li" variant="body2">
                    <Link component={RouterLink} to={routes.watchDetail(item.id)}>
                      {item.brand} {item.name}
                    </Link>
                  </Typography>
                ))}
                {group.items.length > 3 && (
                  <Typography component="li" variant="caption" color="ink.muted" sx={{ listStyle: 'none' }}>
                    and {group.items.length - 3} more in Watches
                  </Typography>
                )}
              </Stack>
            </Box>
          ))}
        </Stack>
      )}
    </Panel>
  );
}
