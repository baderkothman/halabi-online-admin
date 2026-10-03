import { Badge, Box, List, ListItemButton, ListItemIcon, ListItemText, Stack, Tooltip, Typography } from '@mui/material';
import { NavLink, useLocation } from 'react-router-dom';
import { navigation, type NavItem } from './navigation';
import { duration, layout } from '@/theme';

/**
 * The permanent left navigation.
 *
 * Dark chrome against the light working area: it separates "where am I" from
 * "what am I working on" without a heavy border, and it keeps the operator's
 * eye on the content. Collapsed, it drops to icons with tooltips — the labels
 * are short enough that collapsing is a preference, not a necessity.
 */
export function Sidebar({
  collapsed,
  badges,
}: {
  collapsed: boolean;
  /** Counts keyed by `NavItem['badge']`, resolved by the layout. */
  badges: Partial<Record<NonNullable<NavItem['badge']>, number>>;
}) {
  const { pathname } = useLocation();

  return (
    <Box
      component="nav"
      aria-label="Main"
      sx={{
        width: collapsed ? layout.sidebarCollapsedWidth : layout.sidebarWidth,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'surfaceTone.inverse',
        borderRight: 1,
        borderColor: 'line.inverse',
        overflow: 'hidden',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={collapsed ? 0 : 1}
        sx={{ height: layout.topBarHeight, px: collapsed ? 0 : 1.75, flexShrink: 0, justifyContent: collapsed ? 'center' : 'flex-start' }}
      >
        {/* The mark: a minute-track tick, the storefront's one expressive device. */}
        <Box
          aria-hidden
          sx={{
            width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
            border: 1.5, borderColor: 'ink.inverseMuted',
            display: 'grid', placeItems: 'center',
          }}
        >
          <Box sx={{ width: 1.5, height: 7, bgcolor: 'ink.inverse', borderRadius: 1, transform: 'translateY(-2px)' }} />
        </Box>
        <Box
          sx={{
            minWidth: 0,
            overflow: 'hidden',
            flex: collapsed ? '0 0 0' : '1 1 auto',
            opacity: collapsed ? 0 : 1,
            transform: collapsed ? 'translateX(-4px)' : 'translateX(0)',
            visibility: collapsed ? 'hidden' : 'visible',
            transition: `opacity ${duration.standard}ms ease, transform ${duration.standard}ms ease`,
          }}
        >
            <Typography variant="subtitle2" color="ink.inverse" noWrap sx={{ lineHeight: 1.2 }}>
              Halabi Online
            </Typography>
            <Typography variant="caption" color="ink.inverseMuted" noWrap sx={{ fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Administration
            </Typography>
        </Box>
      </Stack>

      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', px: collapsed ? 0.5 : 1, pb: 1 }}>
        {navigation.map((group) => (
          <Box key={group.label} sx={{ mt: 1.5 }}>
            {!collapsed ? (
              <Typography
                variant="overline"
                component="p"
                color="ink.inverseMuted"
                sx={{ px: 1, mb: 0.25, fontSize: 10, opacity: 0.75 }}
              >
                {group.label}
              </Typography>
            ) : null}
            <List dense disablePadding>
              {group.items.map((item) => {
                const active = pathname === item.match || pathname.startsWith(`${item.match}/`);
                const count = item.badge ? (badges[item.badge] ?? 0) : 0;

                return (
                  <Tooltip key={item.to} title={collapsed ? item.label : ''} placement="right">
                    <ListItemButton
                      component={NavLink}
                      to={item.to}
                      // `aria-current` is what a screen reader announces; the
                      // background colour alone conveys nothing.
                      aria-current={active ? 'page' : undefined}
                      sx={{
                        minHeight: 32,
                        px: collapsed ? 0 : 1,
                        mb: 0.25,
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        color: active ? 'ink.inverse' : 'ink.inverseMuted',
                        bgcolor: active ? 'surfaceTone.inverseRaised' : 'transparent',
                        '&:hover': { bgcolor: 'surfaceTone.inverseRaised', color: 'ink.inverse' },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: collapsed ? 0 : 28, color: 'inherit' }}>
                        <Badge
                          badgeContent={count}
                          max={99}
                          color="error"
                          // Collapsed, the badge is the only cue there is unread
                          // work, so it moves onto the icon itself.
                          invisible={count === 0 || !collapsed}
                          sx={{ '& .MuiBadge-badge': { fontSize: 9, height: 14, minWidth: 14 } }}
                        >
                          <item.icon sx={{ fontSize: 18 }} />
                        </Badge>
                      </ListItemIcon>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          minWidth: 0,
                          overflow: 'hidden',
                          flex: collapsed ? '0 0 0' : '1 1 auto',
                          opacity: collapsed ? 0 : 1,
                          transform: collapsed ? 'translateX(-4px)' : 'translateX(0)',
                          visibility: collapsed ? 'hidden' : 'visible',
                          transition: `opacity ${duration.standard}ms ease, transform ${duration.standard}ms ease`,
                        }}
                      >
                        <ListItemText
                          primary={item.label}
                          sx={{ whiteSpace: 'nowrap' }}
                          slotProps={{ primary: { fontSize: '0.8125rem', fontWeight: active ? 600 : 400 } }}
                        />
                        {count > 0 && (
                          <Box
                            component="span"
                            sx={{
                              ml: 1, px: 0.625, minWidth: 18, textAlign: 'center',
                              fontSize: 10, fontWeight: 600, lineHeight: '16px', borderRadius: 1,
                              bgcolor: 'error.main', color: 'common.white', flexShrink: 0,
                            }}
                          >
                            {count > 99 ? '99+' : count}
                          </Box>
                        )}
                      </Box>
                    </ListItemButton>
                  </Tooltip>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
