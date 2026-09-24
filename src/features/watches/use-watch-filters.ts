import { useMemo, useState } from 'react';
import type { AdminWatchListItem, WatchAvailability, WatchVisibility } from '@/types/domain';

/**
 * Search, filter and sort for the watch list.
 *
 * ── Why this is client-side ────────────────────────────────────────────────
 * `GET /admin/dashboard/watches` accepts no query parameters at all: it returns
 * the whole catalogue in one array. Filtering in the browser is therefore the
 * only option against the current contract, not a preference.
 *
 * It is a sound one at this size — a single dealer's catalogue is hundreds of
 * rows, which sorts and filters in well under a frame. It stops being sound in
 * the low thousands, at which point the backend needs the `search`/`page`/
 * `sort` parameters recorded as a requirement in docs/API-INTEGRATION.md. When
 * they arrive, this hook is replaced by query parameters and nothing else in
 * the feature changes.
 */

export type SortKey = 'recent' | 'name' | 'priceHigh' | 'priceLow';

export interface WatchFilters {
  search: string;
  availability: WatchAvailability | 'ALL';
  visibility: WatchVisibility | 'ALL';
  /** A brand name, or the literal 'ALL' for no brand filter. */
  brand: string;
  featuredOnly: boolean;
  sort: SortKey;
}

const initialFilters: WatchFilters = {
  search: '',
  availability: 'ALL',
  visibility: 'ALL',
  brand: 'ALL',
  featuredOnly: false,
  sort: 'recent',
};

export function useWatchFilters(watches: AdminWatchListItem[] | undefined) {
  const [filters, setFilters] = useState<WatchFilters>(initialFilters);

  const update = <K extends keyof WatchFilters>(key: K, value: WatchFilters[K]) =>
    setFilters((current) => ({ ...current, [key]: value }));

  const reset = () => setFilters(initialFilters);

  /** Brand options, derived from the data rather than hardcoded. */
  const brands = useMemo(
    () => [...new Set((watches ?? []).map((watch) => watch.brand).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [watches],
  );

  const results = useMemo(() => {
    if (!watches) return [];
    const term = filters.search.trim().toLowerCase();

    const filtered = watches.filter((watch) => {
      if (filters.availability !== 'ALL' && watch.availability !== filters.availability) return false;
      if (filters.visibility !== 'ALL' && watch.visibility !== filters.visibility) return false;
      if (filters.brand !== 'ALL' && watch.brand !== filters.brand) return false;
      if (filters.featuredOnly && !watch.featured) return false;
      if (!term) return true;
      // Reference numbers are how dealers actually look a piece up, so they are
      // searched alongside the name and brand.
      return (
        watch.name.toLowerCase().includes(term) ||
        watch.brand.toLowerCase().includes(term) ||
        (watch.reference?.toLowerCase().includes(term) ?? false)
      );
    });

    // `toSorted` would be cleaner but is not in every WebView Tauri ships on.
    return [...filtered].sort((a, b) => {
      switch (filters.sort) {
        case 'name':
          return `${a.brand} ${a.name}`.localeCompare(`${b.brand} ${b.name}`);
        case 'priceHigh':
          // A watch with no price set sorts last in both directions: it is an
          // unknown, not a zero.
          return (b.publicPrice ?? -Infinity) - (a.publicPrice ?? -Infinity);
        case 'priceLow':
          return (a.publicPrice ?? Infinity) - (b.publicPrice ?? Infinity);
        case 'recent':
        default:
          return b.createdAt.localeCompare(a.createdAt);
      }
    });
  }, [watches, filters]);

  const isFiltered =
    filters.search !== '' ||
    filters.availability !== 'ALL' ||
    filters.visibility !== 'ALL' ||
    filters.brand !== 'ALL' ||
    filters.featuredOnly;

  return { filters, update, reset, results, brands, isFiltered };
}
