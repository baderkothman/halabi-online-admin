import { Box, Button, Fade, Paper, Skeleton, Stack, Typography } from '@mui/material';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link as RouterLink } from 'react-router-dom';
import { PageBody } from '@/app/layouts/AdminLayout';
import { Panel } from '@/components/common/Panel';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { StatusChip } from '@/components/data-display/StatusChip';
import { dashboardApi, inquiriesApi } from '@/services/api';
import { queryKeys } from '@/services/query-keys';
import { getInquiryStatus } from '@/config/inquiry-status';
import { formatRelative } from '@/lib/format';
import { routes } from '@/config/routes';
import { duration } from '@/theme';
import { useWatches } from '@/features/watches/queries';
import { computeInsights } from './insights';
import { AttentionPanel, InquiryTrendPanel, PipelinePanel, TopWatchesPanel } from './InsightsPanels';

/**
 * The operational dashboard.
 *
 * Four figures, the work queue, then insights computed from the inquiry and
 * watch lists the app already loads: a 30-day inquiry trend, the pipeline,
 * the most inquired pieces and catalogue gaps that block sales. Every chart is
 * drawn from real records; nothing is estimated. The queue stays first because
 * it is what an administrator opens the application to deal with.
 */
export function DashboardPage() {
  const summary = useQuery({
    queryKey: queryKeys.dashboard.summary(),
    queryFn: ({ signal }) => dashboardApi.getSummary(signal),
  });

  // The five most recently updated inquiries, unfiltered. The list endpoint
  // already orders by `updated_at DESC`, so this is the genuine top of the queue.
  const recent = useQuery({
    queryKey: queryKeys.inquiries.list(),
    queryFn: ({ signal }) => inquiriesApi.listInquiries(undefined, signal),
    select: (list) => list.slice(0, 6),
  });

  // Same cache entries as the inbox and catalogue, so these cost no extra requests there.
  const allInquiries = useQuery({
    queryKey: queryKeys.inquiries.list(),
    queryFn: ({ signal }) => inquiriesApi.listInquiries(undefined, signal),
  });
  const watches = useWatches();
  const insights = useMemo(
    () => (allInquiries.data && watches.data ? computeInsights(allInquiries.data, watches.data) : null),
    [allInquiries.data, watches.data],
  );

  return (
    <PageBody>
      <Box
        sx={{
          display: 'grid',
          // A compact summary strip keeps the queue visually dominant. It is
          // still scannable at a narrow width without becoming four floating
          // cards competing with the actual work surface.
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          borderTop: 1,
          borderBottom: 1,
          borderColor: 'line.subtle',
          mb: 2,
          // Dividers follow the grid's own wrapping rather than DOM order, so
          // the two-column mobile layout gets a row divider instead of a
          // stray left border under the first cell.
          '& > *': { borderColor: 'line.subtle' },
          '& > *:nth-of-type(2n)': { borderLeft: { xs: 1, md: 0 } },
          '& > *:nth-of-type(n+3)': { borderTop: { xs: 1, md: 0 } },
          '& > *:not(:nth-of-type(1))': { borderLeft: { md: 1 } },
        }}
      >
        <Metric
          label="Available"
          hint="Published and open to inquiries"
          value={summary.data?.available}
          loading={summary.isPending}
        />
        <Metric
          label="New inquiries"
          hint="Not yet opened"
          value={summary.data?.new_inquiries}
          loading={summary.isPending}
          emphasis={(summary.data?.new_inquiries ?? 0) > 0}
        />
        <Metric
          label="Active discussions"
          hint="In discussion or awaiting a customer"
          value={summary.data?.active_discussions}
          loading={summary.isPending}
        />
        <Metric label="Sold" hint="Lifetime" value={summary.data?.sold} loading={summary.isPending} />
      </Box>

      {summary.isError && (
        <Paper variant="outlined" sx={{ mb: 2 }}>
          <ErrorState error={summary.error} onRetry={() => void summary.refetch()} title="Could not load the summary" />
        </Paper>
      )}

      <Panel
        title="Inquiry queue"
        flush
        action={
          <Button component={RouterLink} to={routes.inquiries} size="small" variant="text">
            Open inbox
          </Button>
        }
      >
        {recent.isPending && (
          <Stack sx={{ p: 1.5 }} spacing={1.25}>
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} height={22} />
            ))}
          </Stack>
        )}

        {recent.isError && <ErrorState error={recent.error} onRetry={() => void recent.refetch()} />}

        {recent.isSuccess && recent.data.length === 0 && (
          <EmptyState title="No inquiries yet" description="Customer inquiries from the storefront will appear here." />
        )}

        {recent.isSuccess && recent.data.length > 0 && (
          <Fade in appear timeout={duration.standard}>
            <Stack divider={<Box sx={{ borderBottom: 1, borderColor: 'line.subtle' }} />}>
              {recent.data.map((inquiry) => {
                const status = getInquiryStatus(inquiry.status);
                return (
                  <Stack
                    key={inquiry.id}
                    component={RouterLink}
                    to={routes.inquiry(inquiry.id)}
                    direction="row"
                    alignItems="center"
                    spacing={1.5}
                    sx={{
                      px: 1.5, py: 1, textDecoration: 'none', color: 'inherit',
                      '&:hover': { bgcolor: 'surfaceTone.sunken' },
                      '&:focus-visible': { outline: 2, outlineColor: 'secondary.main', outlineOffset: -2 },
                    }}
                  >
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        <Typography variant="subtitle2" noWrap>
                          {inquiry.customerName}
                        </Typography>
                        {inquiry.unreadCount > 0 && (
                          <Box
                            component="span"
                            aria-label={`${inquiry.unreadCount} unread`}
                            sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'error.main', flexShrink: 0 }}
                          />
                        )}
                      </Stack>
                      <Typography variant="caption" color="ink.muted" noWrap sx={{ display: 'block' }}>
                        {inquiry.watchBrand} {inquiry.watchName}
                      </Typography>
                    </Box>
                    <StatusChip label={status.label} tone={status.tone} sx={{ flexShrink: 0 }} />
                    <Typography variant="caption" color="ink.muted" sx={{ width: 64, textAlign: 'right', flexShrink: 0 }}>
                      {formatRelative(inquiry.createdAt)}
                    </Typography>
                  </Stack>
                );
              })}
            </Stack>
          </Fade>
        )}
      </Panel>

      {insights && (
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            mt: 2,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', lg: '2fr 1fr' },
          }}
        >
          <InquiryTrendPanel insights={insights} />
          <PipelinePanel insights={insights} />
          <TopWatchesPanel insights={insights} />
          <AttentionPanel insights={insights} />
        </Box>
      )}
      {(allInquiries.isPending || watches.isPending) && !insights && (
        <Box sx={{ display: 'grid', gap: 2, mt: 2, gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' } }}>
          <Skeleton variant="rounded" height={180} />
          <Skeleton variant="rounded" height={180} />
        </Box>
      )}
    </PageBody>
  );
}

/**
 * A single figure.
 *
 * Small label, large number, one line of context. The number is the only thing
 * set at display size on this screen — oversized KPI tiles in a grid of four is
 * the most recognisable generated-dashboard pattern there is.
 */
function Metric({
  label, hint, value, loading, emphasis = false,
}: {
  label: string;
  hint: string;
  value: number | undefined;
  loading: boolean;
  emphasis?: boolean;
}) {
  return (
    <Box
      sx={{ p: 1.5, minWidth: 0 }}
    >
      <Typography variant="overline" color="ink.muted" component="p">
        {label}
      </Typography>
      {loading ? (
        <Skeleton width={44} height={30} sx={{ my: 0.25 }} />
      ) : (
        // Fades in rather than popping against the skeleton it replaces — the
        // figure is arriving, not just appearing.
        <Fade in appear timeout={duration.fast}>
          <Typography
            sx={{
              fontSize: 26, fontWeight: 600, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums',
              color: emphasis ? 'error.main' : 'ink.primary',
            }}
          >
            {value ?? '—'}
          </Typography>
        </Fade>
      )}
      <Typography variant="caption" color="ink.muted">
        {hint}
      </Typography>
    </Box>
  );
}
