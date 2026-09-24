import { useState, type ReactNode } from 'react';
import { Box } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { titleForPath } from './navigation';
import { AppErrorBoundary } from '@/app/error-boundary/AppErrorBoundary';
import { dashboardApi } from '@/services/api';
import { queryKeys } from '@/services/query-keys';

/**
 * The application shell.
 *
 * The whole window is a flex column that never scrolls; only the content region
 * does. That is what keeps the sidebar and header fixed the way a desktop
 * application should behave, rather than scrolling away like a web page.
 */
export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { pathname } = useLocation();

  // The sidebar's unread badge. It reuses the dashboard summary rather than
  // adding a request: the same endpoint already returns the NEW inquiry count,
  // and it is cached, so navigating does not refetch it.
  const { data: summary } = useQuery({
    queryKey: queryKeys.dashboard.summary(),
    queryFn: ({ signal }) => dashboardApi.getSummary(signal),
    // Refreshed on a slow timer so a new inquiry surfaces without the operator
    // reloading, but not often enough to be a polling load on the API.
    refetchInterval: 120_000,
  });

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <Sidebar collapsed={collapsed} badges={{ newInquiries: summary?.new_inquiries ?? 0 }} />

      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <TopBar title={titleForPath(pathname)} collapsed={collapsed} onToggleSidebar={() => setCollapsed((value) => !value)} />

        <Box component="main" sx={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Keyed on the path so navigating away from a crashed screen recovers. */}
          <AppErrorBoundary resetKey={pathname}>
            <Outlet />
          </AppErrorBoundary>
        </Box>
      </Box>
    </Box>
  );
}

/**
 * Standard page padding for screens that scroll their own body.
 *
 * The inquiries inbox opts out of this — it is a fixed two-pane layout that
 * manages its own scroll regions.
 */
export function PageBody({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: 2 }}>
      <Box sx={{ maxWidth: 1360, mx: 'auto' }}>{children}</Box>
    </Box>
  );
}
