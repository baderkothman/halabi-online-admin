import { type ReactNode } from 'react';
import { Box } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { titleForPath } from './navigation';
import { AppErrorBoundary } from '@/app/error-boundary/AppErrorBoundary';
import { dashboardApi } from '@/services/api';
import { queryKeys } from '@/services/query-keys';
import { updateSettings, useSettings } from '@/app/settings/settings';
import { useNewInquiryAlerts } from '@/app/notifications/use-new-inquiry-alerts';

/**
 * The application shell.
 *
 * The whole window is a flex column that never scrolls; only the content region
 * does. That is what keeps the sidebar and header fixed the way a desktop
 * application should behave, rather than scrolling away like a web page.
 */
export function AdminLayout() {
  // Remembered across launches.
  const { sidebarCollapsed: collapsed } = useSettings();
  const { pathname } = useLocation();

  // The sidebar's unread badge. It reuses the dashboard summary rather than
  // adding a request: the same endpoint already returns the NEW inquiry count,
  // and it is cached, so navigating does not refetch it.
  const { data: summary } = useQuery({
    queryKey: queryKeys.dashboard.summary(),
    queryFn: ({ signal }) => dashboardApi.getSummary(signal),
    // Refreshed every 30s so a new inquiry is announced promptly. It is one
    // small aggregate query, so the polling load on the API stays negligible.
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
  });
  useNewInquiryAlerts(summary?.new_inquiries);

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <Sidebar collapsed={collapsed} badges={{ newInquiries: summary?.new_inquiries ?? 0 }} />

      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <TopBar title={titleForPath(pathname)} collapsed={collapsed} onToggleSidebar={() => updateSettings((settings) => ({ ...settings, sidebarCollapsed: !settings.sidebarCollapsed }))} />

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
