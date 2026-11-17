import { useState } from 'react';
import {
  Box, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TablePagination, TableRow,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import WatchOutlinedIcon from '@mui/icons-material/WatchOutlined';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { TableSkeleton } from '@/components/feedback/TableSkeleton';
import { WatchFilterBar } from './WatchFilterBar';
import { WatchRow } from './WatchRow';
import { useUpdateWatch, useWatches } from './queries';
import { useWatchFilters, type WatchFilters } from './use-watch-filters';
import { routes } from '@/config/routes';
import { useSnackbar } from '@/app/providers/SnackbarProvider';
import { toDisplayMessage } from '@/services/api';
import type { WatchWriteInput } from '@/types/domain';

const COLUMN_COUNT = 9;
const ROWS_PER_PAGE = 25;

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

  const publishedCount = watches.data?.filter((item) => item.visibility === 'PUBLIC').length ?? 0;
  const visible = results.slice(page * ROWS_PER_PAGE, page * ROWS_PER_PAGE + ROWS_PER_PAGE);

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
          <Button component={RouterLink} to={routes.newWatch} variant="contained" startIcon={<AddIcon sx={{ fontSize: 16 }} />}>
            New watch
          </Button>
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

        {watches.isSuccess && results.length > ROWS_PER_PAGE && (
          <TablePagination
            component="div"
            count={results.length}
            page={page}
            onPageChange={(_, next) => setPage(next)}
            rowsPerPage={ROWS_PER_PAGE}
            // A row-count selector just reintroduces a scroll problem on a
            // fixed-height pane; the page size is chosen to fill the viewport.
            rowsPerPageOptions={[ROWS_PER_PAGE]}
          />
        )}
      </Paper>
    </Box>
  );
}
