import { Button, Checkbox, FormControlLabel, InputAdornment, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import type { SortKey, WatchFilters } from './use-watch-filters';
import { availabilityPresentation, visibilityPresentation } from '@/config/availability';
import { WATCH_AVAILABILITY, WATCH_VISIBILITY, type WatchAvailability, type WatchVisibility } from '@/types/domain';

/**
 * The catalogue toolbar.
 *
 * Presentational: it renders the current filters and reports changes. The state
 * and the filtering itself live in `use-watch-filters.ts`, so this component
 * does not need to change when the API grows server-side filter parameters.
 */
export function WatchFilterBar({
  filters, brands, isFiltered, onChange, onReset,
}: {
  filters: WatchFilters;
  brands: string[];
  isFiltered: boolean;
  onChange: <K extends keyof WatchFilters>(key: K, value: WatchFilters[K]) => void;
  onReset: () => void;
}) {
  return (
    <Paper variant="outlined" sx={{ mb: 1.5, p: 1, bgcolor: 'surfaceTone.sunken', flexShrink: 0 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 1 }}>
        <TextField
          value={filters.search}
          onChange={(event) => onChange('search', event.target.value)}
          placeholder="Search name, brand or reference"
          aria-label="Search watches"
          sx={{ width: 260 }}
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

        <TextField
          select
          value={filters.availability}
          onChange={(event) => onChange('availability', event.target.value as WatchAvailability | 'ALL')}
          label="Availability"
          sx={{ width: 150 }}
        >
          <MenuItem value="ALL">All</MenuItem>
          {WATCH_AVAILABILITY.map((status) => (
            <MenuItem key={status} value={status}>
              {availabilityPresentation[status].label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          value={filters.visibility}
          onChange={(event) => onChange('visibility', event.target.value as WatchVisibility | 'ALL')}
          label="Storefront"
          sx={{ width: 150 }}
        >
          <MenuItem value="ALL">All</MenuItem>
          {WATCH_VISIBILITY.map((value) => (
            <MenuItem key={value} value={value}>
              {visibilityPresentation[value].label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          value={filters.brand}
          onChange={(event) => onChange('brand', event.target.value)}
          label="Brand"
          sx={{ width: 150 }}
          disabled={brands.length === 0}
        >
          <MenuItem value="ALL">All</MenuItem>
          {brands.map((brand) => (
            <MenuItem key={brand} value={brand}>
              {brand}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          value={filters.sort}
          onChange={(event) => onChange('sort', event.target.value as SortKey)}
          label="Sort"
          sx={{ width: 150 }}
        >
          <MenuItem value="recent">Newest first</MenuItem>
          <MenuItem value="name">Name</MenuItem>
          <MenuItem value="priceHigh">Price, high to low</MenuItem>
          <MenuItem value="priceLow">Price, low to high</MenuItem>
        </TextField>

        <FormControlLabel
          control={
            <Checkbox
              checked={filters.featuredOnly}
              onChange={(event) => onChange('featuredOnly', event.target.checked)}
            />
          }
          label={<Typography variant="body2">Featured only</Typography>}
        />

        {isFiltered && (
          <Button size="small" variant="text" onClick={onReset} sx={{ ml: 'auto' }}>
            Clear filters
          </Button>
        )}
      </Stack>
    </Paper>
  );
}
