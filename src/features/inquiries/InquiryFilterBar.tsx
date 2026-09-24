import { Box, InputAdornment, MenuItem, TextField, ToggleButton, ToggleButtonGroup } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { INQUIRY_STATUS, type InquiryStatus } from '@/types/domain';
import { inquiryStatusPresentation } from '@/config/inquiry-status';
import type { InboxScope } from './use-inquiry-filters';

/**
 * The inbox's filter controls.
 *
 * Scope comes first and defaults to Open, because the list a dealer opens in
 * the morning should be the work rather than the archive.
 */
export function InquiryFilterBar({
  scope, status, search, unreadTotal, onScope, onStatus, onSearch,
}: {
  scope: InboxScope;
  status: InquiryStatus | 'ALL';
  search: string;
  unreadTotal: number;
  onScope: (scope: InboxScope) => void;
  onStatus: (status: InquiryStatus | 'ALL') => void;
  onSearch: (search: string) => void;
}) {
  return (
    <Box sx={{ p: 1.25, borderBottom: 1, borderColor: 'line.subtle', flexShrink: 0 }}>
      <ToggleButtonGroup
        value={scope}
        exclusive
        size="small"
        onChange={(_, next: InboxScope | null) => next && onScope(next)}
        aria-label="Inquiry scope"
        fullWidth
        sx={{ mb: 1, '& .MuiToggleButton-root': { py: 0.375, fontSize: '0.75rem', textTransform: 'none' } }}
      >
        <ToggleButton value="OPEN">Open</ToggleButton>
        <ToggleButton value="UNREAD">Unread{unreadTotal > 0 ? ` (${unreadTotal})` : ''}</ToggleButton>
        <ToggleButton value="ALL">All</ToggleButton>
      </ToggleButtonGroup>

      <TextField
        value={search}
        onChange={(event) => onSearch(event.target.value)}
        placeholder="Search customer, watch or contact"
        aria-label="Search inquiries"
        sx={{ mb: 1 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 16, color: 'ink.muted' }} />
              </InputAdornment>
            ),
          },
        }}
      />

      <TextField select value={status} onChange={(event) => onStatus(event.target.value as InquiryStatus | 'ALL')} label="Status">
        <MenuItem value="ALL">Any status</MenuItem>
        {INQUIRY_STATUS.map((value) => (
          <MenuItem key={value} value={value}>
            {inquiryStatusPresentation[value].label}
          </MenuItem>
        ))}
      </TextField>
    </Box>
  );
}
