import { useState } from 'react';
import {
  Box, Button, Paper, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead,
  TablePagination, TableRow, ToggleButton, ToggleButtonGroup, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import GridViewIcon from '@mui/icons-material/GridView';
import TableRowsOutlinedIcon from '@mui/icons-material/TableRowsOutlined';
import WatchOutlinedIcon from '@mui/icons-material/WatchOutlined';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { TableSkeleton } from '@/components/feedback/TableSkeleton';
import { WatchFilterBar } from './WatchFilterBar';
import { WatchRow } from './WatchRow';
import { WatchCard } from './WatchCard';
import { updateSettings, useSettings, type WatchesView } from '@/app/settings/settings';
import { useUpdateWatch, useWatches } from './queries';
import { useWatchFilters, type WatchFilters } from './use-watch-filters';
import { routes } from '@/config/routes';
import { useSnackbar } from '@/app/providers/SnackbarProvider';
import { toDisplayMessage } from '@/services/api';
import type { WatchWriteInput } from '@/types/domain';

const COLUMN_COUNT = 9;
/** Per view: 25 table rows fill a laptop screen; 24 cards divide into 2, 3, 4 and 6 columns. */
const PAGE_SIZE: Record<WatchesView, number> = { table: 25, grid: 24 };

/**
 * The catalogue.
 *
 * A fixed layout rather than a scrolling page: the toolbar stays put and the
 * table scrolls in the space left over, which is what keeps the sticky column
 * headers meaningful and matches how a desktop application behaves.
 */
export function WatchesPage() {
  const navigate = useNavigate();
  const { notifySuccess, notifyError } = useSnackbar();
  const watches = useWatches();
  const updateWatch = useUpdateWatch();
  const { filters, update, reset, results, brands, isFiltered } = useWatchFilters(watches.data);
  const [page, setPage] = useState(0);
  const { watchesView: view } = useSettings();
  const rowsPerPage = PAGE_SIZE[view];

  const publishedCount = watches.data?.filter((item) => item.visibility === 'PUBLIC').length ?? 0;
  const visible = results.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  /** Any filter change returns to the first page — page 4 of a new result set is nowhere. */
  const changeFilter = <K extends keyof WatchFilters>(key: K, value: WatchFilters[K]) => {
    update(key, value);
    setPage(0);
  };

  const clearFilters = () => {
    reset();
    setPage(0);
  };

  /** One mutation path for every inline edit, so feedback stays consistent. */
  const patch = (id: string, name: string, input: Partial<WatchWriteInput>, message: string) => {
    updateWatch.mutate(
      { id, input },
      {
        onSuccess: () => notifySuccess(`${name} ${message}`),
        onError: (error) => notifyError(toDisplayMessage(error)),
      },
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, p: 2, pb: 0 }}>
      <PageHeader
        summary={
          watches.isSuccess
            ? `${watches.data.length} ${watches.data.length === 1 ? 'piece' : 'pieces'} · ${publishedCount} published`
            : undefined
        }
        actions={
          <>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={view}
              aria-label="Catalogue layout"
              onChange={(_, next: WatchesView | null) => {
                if (!next) return;
                updateSettings((settings) => ({ ...settings, watchesView: next }));
                setPage(0);
              }}
            >
              <Tooltip title="Grid with photos">
                <ToggleButton value="grid" aria-label="Grid with photos"><GridViewIcon sx={{ fontSize: 17 }} /></ToggleButton>
              </Tooltip>
              <Tooltip title="Compact table">
                <ToggleButton value="table" aria-label="Compact table"><TableRowsOutlinedIcon sx={{ fontSize: 17 }} /></ToggleButton>
              </Tooltip>
            </ToggleButtonGroup>
            <Button component={RouterLink} to={routes.newWatch} variant="contained" startIcon={<AddIcon sx={{ fontSize: 16 }} />}>
              New watch
            </Button>
          </>
        }
      />

      <WatchFilterBar
        filters={filters}
        brands={brands}
        isFiltered={isFiltered}
        onChange={changeFilter}
        onReset={clearFilters}
      />

      <Paper
        variant="outlined"
        sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, mb: 2, overflow: 'hidden' }}
      >
        {view === 'grid' && (
          <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: 1.5 }}>
            <Box
              component="ul"
              aria-label="Watches"
              sx={{
                listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 1.5,
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              }}
            >
              {watches.isPending &&
                Array.from({ length: 8 }, (_, index) => (
                  <Box component="li" key={index}>
                    <Skeleton variant="rectangular" sx={{ aspectRatio: '4 / 3', height: 'auto' }} />
                    <Skeleton width="40%" />
                    <Skeleton width="70%" />
                  </Box>
                ))}
              {watches.isSuccess &&
                visible.map((item) => (
                  <Box component="li" key={item.id} sx={{ display: 'flex', '& > *': { flex: 1 } }}>
                    <WatchCard
                      watch={item}
                      busy={updateWatch.isPending}
                      onPatch={(input, message) => patch(item.id, item.name, input, message)}
                      onEdit={() => void navigate(routes.watchDetail(item.id))}
                    />
                  </Box>
                ))}
            </Box>
          </Box>
        )}

        {view === 'table' && (
          <TableContainer sx={{ flex: 1, minHeight: 0 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" />
                  <TableCell>Watch</TableCell>
                  <TableCell>Reference</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell>Availability</TableCell>
                  <TableCell>Storefront</TableCell>
                  <TableCell align="center">Featured</TableCell>
                  <TableCell>Added</TableCell>
                  <TableCell align="right">Open</TableCell>
                </TableRow>
              </TableHead>

              {watches.isPending && <TableSkeleton columns={COLUMN_COUNT} />}

              {watches.isSuccess && (
                <TableBody>
                  {visible.map((item) => (
                    <WatchRow
                      key={item.id}
                      watch={item}
                      busy={updateWatch.isPending}
                      onPatch={(input, message) => patch(item.id, item.name, input, message)}
                      onEdit={() => void navigate(routes.watchDetail(item.id))}
                    />
                  ))}
                </TableBody>
              )}
            </Table>
          </TableContainer>
        )}

        {watches.isError && (
          <ErrorState error={watches.error} onRetry={() => void watches.refetch()} title="Could not load the catalogue" />
        )}

        {watches.isSuccess && results.length === 0 && (
          <EmptyState
            icon={<WatchOutlinedIcon sx={{ fontSize: 26 }} />}
            title={isFiltered ? 'No watches match these filters' : 'No watches yet'}
            description={
              isFiltered
                ? 'Try a different search term, or clear the filters to see the whole catalogue.'
                : 'Add the first piece to the catalogue to get started.'
            }
            action={
              isFiltered
                ? { label: 'Clear filters', onClick: clearFilters }
                : { label: 'New watch', onClick: () => void navigate(routes.newWatch) }
            }
          />
        )}

        {watches.isSuccess && results.length > rowsPerPage && (
          <TablePagination
            component="div"
            count={results.length}
            page={page}
            onPageChange={(_, next) => setPage(next)}
            rowsPerPage={rowsPerPage}
            // A row-count selector just reintroduces a scroll problem on a
            // fixed-height pane; the page size is chosen to fill the viewport.
            rowsPerPageOptions={[rowsPerPage]}
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} of ${count}`}
          />
        )}
      </Paper>
    </Box>
  );
}
