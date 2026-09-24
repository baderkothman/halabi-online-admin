import { useState } from 'react';
import { Avatar, Box, Divider, IconButton, Menu, MenuItem, Stack, Tooltip, Typography } from '@mui/material';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '@/features/auth/auth-context';
import { initials } from '@/lib/format';
import { layout } from '@/theme';

/**
 * The window's title bar: the current page name, and the account menu.
 *
 * Deliberately thin (52px) and free of decoration. A global search box would
 * sit here in a larger product, but the API has no search endpoint to back one,
 * and an input that searches nothing is worse than an absence.
 */
export function TopBar({
  title,
  collapsed,
  onToggleSidebar,
}: {
  title: string;
  collapsed: boolean;
  onToggleSidebar: () => void;
}) {
  const { user, signOut } = useAuth();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  return (
    <Stack
      component="header"
      direction="row"
      alignItems="center"
      spacing={1}
      sx={{
        height: layout.topBarHeight,
        flexShrink: 0,
        px: 1.5,
        borderBottom: 1,
        borderColor: 'line.subtle',
        bgcolor: 'surfaceTone.raised',
      }}
    >
      <Tooltip title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
        <IconButton onClick={onToggleSidebar} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? <MenuIcon sx={{ fontSize: 19 }} /> : <MenuOpenIcon sx={{ fontSize: 19 }} />}
        </IconButton>
      </Tooltip>

      {/* The page's h1. There is exactly one per screen and it lives here. */}
      <Typography variant="h1" component="h1" sx={{ fontSize: '0.9375rem', fontWeight: 600 }}>
        {title}
      </Typography>

      <Box sx={{ flex: 1 }} />

      <IconButton
        onClick={(event) => setAnchor(event.currentTarget)}
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={anchor ? 'true' : undefined}
        sx={{ p: 0.25 }}
      >
        <Avatar
          sx={{
            width: 26, height: 26, fontSize: 11, fontWeight: 600,
            bgcolor: 'surfaceTone.sunken', color: 'ink.secondary', border: 1, borderColor: 'line.subtle',
          }}
        >
          {initials(user?.displayName ?? '')}
        </Avatar>
      </IconButton>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ px: 1.5, py: 1, maxWidth: 240 }}>
          <Typography variant="subtitle2" noWrap>
            {user?.displayName}
          </Typography>
          <Typography variant="caption" color="ink.muted" noWrap sx={{ display: 'block' }}>
            {user?.email}
          </Typography>
        </Box>
        <Divider />
        <MenuItem
          onClick={() => {
            setAnchor(null);
            signOut();
          }}
        >
          <LogoutIcon sx={{ fontSize: 16, mr: 1, color: 'ink.muted' }} />
          Sign out
        </MenuItem>
      </Menu>
    </Stack>
  );
}
