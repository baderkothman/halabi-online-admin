import { useEffect, useState } from 'react';
import { Box, Button, FormControlLabel, List, ListItemButton, ListItemText, Stack, Switch, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { getVersion } from '@tauri-apps/api/app';
import { PageBody } from '@/app/layouts/AdminLayout';
import { Panel } from '@/components/common/Panel';
import { useSnackbar } from '@/app/providers/SnackbarProvider';
import { updateSettings, useSettings } from '@/app/settings/settings';
import { showDesktopNotification } from '@/lib/desktop-notifications';
import { isDesktopApp } from '@/lib/updater';
import { routes } from '@/config/routes';
import { TemplatesSection } from './TemplatesSection';

const SECTIONS = [
  { id: 'general', label: 'General', description: 'Layout preferences' },
  { id: 'notifications', label: 'Notifications', description: 'New inquiry alerts' },
  { id: 'templates', label: 'Templates', description: 'Contact messages and quick replies' },
  { id: 'about', label: 'About', description: 'Version and updates' },
] as const;
type SectionId = (typeof SECTIONS)[number]['id'];

function GeneralSection() {
  const { sidebarCollapsed } = useSettings();
  return (
    <Panel title="Layout">
      <FormControlLabel
        control={
          <Switch
            checked={sidebarCollapsed}
            onChange={(event) => updateSettings((settings) => ({ ...settings, sidebarCollapsed: event.target.checked }))}
          />
        }
        label="Collapse the sidebar to icons"
      />
      <Typography variant="caption" color="ink.muted" component="p">
        You can also toggle it from the button at the top left. The choice is remembered on this computer.
      </Typography>
    </Panel>
  );
}

function NotificationsSection() {
  const { desktopNotifications } = useSettings();
  const { notifyInfo, notifyError } = useSnackbar();
  const desktop = isDesktopApp();

  return (
    <Panel title="New inquiries">
      <Stack spacing={1.5}>
        <Typography variant="body2" color="ink.secondary">
          The app checks for new inquiries every 30 seconds. While you are using it, a notice appears at the bottom of
          the window with a link to the inbox, and the Inquiries badge in the sidebar updates.
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={desktopNotifications}
              disabled={!desktop}
              onChange={(event) => updateSettings((settings) => ({ ...settings, desktopNotifications: event.target.checked }))}
            />
          }
          label="Show a desktop notification when the app is in the background"
        />
        {!desktop && (
          <Typography variant="caption" color="ink.muted">
            Desktop notifications are available in the installed app, not in the browser preview.
          </Typography>
        )}
        <Box>
          <Button
            variant="outlined"
            size="small"
            disabled={!desktop || !desktopNotifications}
            onClick={() => {
              void showDesktopNotification('Notifications are working', 'You will see new inquiries here.').then((shown) => {
                if (shown) notifyInfo('Test notification sent.');
                else notifyError('Notifications are blocked. Allow them for Halabi Online Admin in your system settings.');
              });
            }}
          >
            Send a test notification
          </Button>
        </Box>
      </Stack>
    </Panel>
  );
}

function AboutSection() {
  const [version, setVersion] = useState<string | null>(null);
  useEffect(() => {
    if (!isDesktopApp()) return;
    getVersion().then(setVersion).catch(() => setVersion(null));
  }, []);

  return (
    <Panel title="Halabi Online Admin">
      <Stack spacing={1}>
        <Typography variant="body2">Version {version ?? (isDesktopApp() ? '…' : 'development build')}</Typography>
        <Typography variant="body2" color="ink.secondary">
          Updates are checked automatically when the app starts. When one is ready, a notice offers to install it and
          restart.
        </Typography>
        <Typography variant="caption" color="ink.muted">
          Settings on this page are stored on this computer only. Your sign-in is kept in the system keychain.
        </Typography>
      </Stack>
    </Panel>
  );
}

/**
 * Settings, grouped by category. The section is part of the URL
 * (`/settings/templates`) so a link or the back button returns to it.
 */
export function SettingsPage() {
  const { section } = useParams<{ section?: string }>();
  const navigate = useNavigate();
  const active: SectionId = SECTIONS.some((item) => item.id === section) ? (section as SectionId) : 'general';

  return (
    <PageBody>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-start">
        <Box component="nav" aria-label="Settings sections" sx={{ width: { xs: '100%', md: 220 }, flexShrink: 0 }}>
          <List dense disablePadding>
            {SECTIONS.map((item) => (
              <ListItemButton
                key={item.id}
                selected={item.id === active}
                aria-current={item.id === active ? 'page' : undefined}
                onClick={() => void navigate(routes.settingsSection(item.id))}
                sx={{ borderRadius: 1, mb: 0.25 }}
              >
                <ListItemText primary={item.label} secondary={item.description} />
              </ListItemButton>
            ))}
          </List>
        </Box>
        <Box sx={{ flex: 1, minWidth: 0, maxWidth: 820, width: '100%' }}>
          {active === 'general' && <GeneralSection />}
          {active === 'notifications' && <NotificationsSection />}
          {active === 'templates' && <TemplatesSection />}
          {active === 'about' && <AboutSection />}
        </Box>
      </Stack>
    </PageBody>
  );
}
