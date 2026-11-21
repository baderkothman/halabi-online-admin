import type { SvgIconComponent } from '@mui/icons-material';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import WatchOutlinedIcon from '@mui/icons-material/WatchOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { routes } from '@/config/routes';

/**
 * The sidebar's contents.
 *
 * Only sections that can load real data appear. Settings holds device-local
 * preferences (no API needed). Categories, Customers, Sales, Finance and
 * Testimonials are deliberately absent: the
 * database has tables for most of them, but the API exposes no admin endpoints,
 * and a navigation item leading to a screen that cannot load anything is worse
 * than no item at all. The gaps are recorded in docs/API-INTEGRATION.md.
 */

export interface NavItem {
  label: string;
  to: string;
  icon: SvgIconComponent;
  /** Matched as a prefix, so a detail route keeps its parent highlighted. */
  match: string;
  /** Query-driven badge, resolved by the sidebar. */
  badge?: 'newInquiries';
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navigation: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', to: routes.dashboard, icon: DashboardOutlinedIcon, match: routes.dashboard }],
  },
  {
    label: 'Catalogue',
    items: [{ label: 'Watches', to: routes.watches, icon: WatchOutlinedIcon, match: routes.watches }],
  },
  {
    label: 'Customers',
    items: [
      { label: 'Inquiries', to: routes.inquiries, icon: ForumOutlinedIcon, match: routes.inquiries, badge: 'newInquiries' },
    ],
  },
  {
    label: 'System',
    items: [{ label: 'Settings', to: routes.settings, icon: SettingsOutlinedIcon, match: routes.settings }],
  },
];

/** The page title shown in the top bar, by route prefix. Longest match wins. */
const titles: ReadonlyArray<readonly [string, string]> = [
  [routes.newWatch, 'New watch'],
  [routes.watches, 'Watches'],
  [routes.inquiries, 'Inquiries'],
  [routes.dashboard, 'Dashboard'],
  [routes.settings, 'Settings'],
];

export function titleForPath(pathname: string): string {
  const match = titles.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  return match?.[1] ?? 'Halabi Online';
}
