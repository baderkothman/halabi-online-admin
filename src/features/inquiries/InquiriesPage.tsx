import { Box, Skeleton, Stack, Typography } from '@mui/material';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import { useNavigate, useParams } from 'react-router-dom';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { InquiryList } from './InquiryList';
import { InquiryDetailPane } from './InquiryDetailPane';
import { InquiryFilterBar } from './InquiryFilterBar';
import { useInquiryFilters } from './use-inquiry-filters';
import { useInquiries } from './queries';
import { routes } from '@/config/routes';

/**
 * The inquiry inbox — the screen this application exists for.
 *
 * Two fixed panes, each scrolling independently, neither pushing the other.
 * This component owns only the layout and the three data states; filtering
 * lives in `use-inquiry-filters.ts` and the controls in `InquiryFilterBar`.
 */
export function InquiriesPage() {
  const { id: selectedId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const inquiries = useInquiries();
  const filters = useInquiryFilters(inquiries.data);

  return (
    <Box sx={{ display: 'flex', height: '100%', minHeight: 0 }}>
      <Stack
        sx={{
          width: 340, flexShrink: 0, minHeight: 0,
          borderRight: 1, borderColor: 'line.subtle', bgcolor: 'surfaceTone.raised',
        }}
      >
        <InquiryFilterBar
          scope={filters.scope}
          status={filters.status}
          search={filters.search}
          unreadTotal={filters.unreadTotal}
          onScope={filters.setScope}
          onStatus={filters.setStatus}
          onSearch={filters.setSearch}
        />

        <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {inquiries.isPending && (
            <Stack spacing={1.5} sx={{ p: 1.5 }}>
              {Array.from({ length: 6 }, (_, index) => (
                <Box key={index}>
                  <Skeleton width="55%" height={18} />
                  <Skeleton width="75%" height={14} />
                </Box>
              ))}
            </Stack>
          )}

          {inquiries.isError && <ErrorState error={inquiries.error} onRetry={() => void inquiries.refetch()} />}

          {inquiries.isSuccess && filters.results.length === 0 && (
            <EmptyState
              title={filters.isFiltered ? 'Nothing matches' : 'No inquiries'}
              description={
                filters.isFiltered
                  ? 'Try a different search, or widen the scope to All.'
                  : 'Inquiries sent from the storefront will arrive here.'
              }
              {...(filters.isFiltered ? { action: { label: 'Show all', onClick: filters.showEverything } } : {})}
            />
          )}

          {inquiries.isSuccess && filters.results.length > 0 && (
            <InquiryList
              inquiries={filters.results}
              selectedId={selectedId}
              onSelect={(id) => void navigate(routes.inquiry(id))}
            />
          )}
        </Box>

        {inquiries.isSuccess && filters.results.length > 0 && (
          <Box sx={{ px: 1.5, py: 0.75, borderTop: 1, borderColor: 'line.subtle', flexShrink: 0 }}>
            <Typography variant="caption" color="ink.muted">
              {filters.results.length} of {inquiries.data.length}
            </Typography>
          </Box>
        )}
      </Stack>

      <Box sx={{ flex: 1, minWidth: 0, minHeight: 0, bgcolor: 'surfaceTone.raised' }}>
        {selectedId ? (
          // Keyed on the id so switching inquiries resets the reply draft and
          // any open menu, instead of carrying one customer's half-written
          // message into another's thread.
          <InquiryDetailPane key={selectedId} id={selectedId} />
        ) : (
          <EmptyState
            icon={<ForumOutlinedIcon sx={{ fontSize: 28 }} />}
            title="Select an inquiry"
            description={
              filters.results.length > 0
                ? 'Choose a conversation on the left to read it and reply.'
                : 'There is nothing in this view to open.'
            }
          />
        )}
      </Box>
    </Box>
  );
}
