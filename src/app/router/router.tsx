import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminLayout } from '@/app/layouts/AdminLayout';
import { RequireAuth } from './RequireAuth';
import { LoginPage } from '@/features/auth/LoginPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { WatchesPage } from '@/features/watches/WatchesPage';
import { WatchFormPage } from '@/features/watches/WatchFormPage';
import { InquiriesPage } from '@/features/inquiries/InquiriesPage';
import { NotFoundPage } from './NotFoundPage';
import { RouteErrorBoundary } from './RouteErrorBoundary';
import { HOME_ROUTE, routes } from '@/config/routes';

/**
 * The route table.
 *
 * Everything except `/login` sits under `RequireAuth`, so adding a screen
 * cannot accidentally leave it unguarded. The inbox is registered twice —
 * with and without an id — because selecting an inquiry updates the URL while
 * keeping the same two-pane screen mounted.
 */
export const router = createBrowserRouter([
  { path: routes.login, element: <LoginPage />, errorElement: <RouteErrorBoundary /> },
  {
    element: <RequireAuth />,
    // Without this, a router-level failure falls through to React Router's
    // generic default screen, outside this application's chrome entirely.
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/', element: <Navigate to={HOME_ROUTE} replace /> },
          { path: routes.dashboard, element: <DashboardPage /> },
          { path: routes.watches, element: <WatchesPage /> },
          { path: routes.newWatch, element: <WatchFormPage /> },
          { path: '/watches/:id', element: <WatchFormPage /> },
          { path: routes.inquiries, element: <InquiriesPage /> },
          { path: '/inquiries/:id', element: <InquiriesPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
