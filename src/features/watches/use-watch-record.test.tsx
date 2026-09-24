import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useWatchRecord } from './use-watch-record';
import { queryKeys } from '@/services/query-keys';
import type { AdminWatchListItem } from '@/types/domain';

/**
 * The form seeds itself from `seed` inside an effect. If `seed` were a fresh
 * object on every render, that effect would re-run and `reset()` the form on
 * each keystroke — silently wiping whatever the operator had typed.
 *
 * This is a regression test for exactly that: the identity must be stable
 * across renders when nothing underneath has changed.
 */

const watch: AdminWatchListItem = {
  id: 'watch-1',
  slug: 'omega-seamaster-300',
  name: 'Seamaster 300',
  brand: 'Omega',
  reference: 'ST 165.024',
  publicPrice: 4200,
  // PRIVATE, so the public detail endpoint is never queried and the hook
  // settles synchronously from cache alone.
  availability: 'AVAILABLE',
  visibility: 'PRIVATE',
  featured: false,
  createdAt: '2026-01-01T00:00:00Z',
};

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

function seededClient() {
  // `staleTime: Infinity` keeps the seeded cache authoritative — otherwise the
  // hook fires a real request that jsdom cannot serve, which is noise unrelated
  // to what these tests assert.
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  client.setQueryData(queryKeys.watches.list(), [watch]);
  client.setQueryData(queryKeys.categories.list(), []);
  return client;
}

describe('useWatchRecord', () => {
  it('keeps the seed object identity stable across re-renders', () => {
    const { result, rerender } = renderHook(() => useWatchRecord('watch-1'), { wrapper: wrapper(seededClient()) });

    const first = result.current.seed;
    expect(first).toBeDefined();
    expect(first?.name).toBe('Seamaster 300');

    rerender();
    rerender();

    expect(result.current.seed).toBe(first);
  });

  it('reports that detail is unavailable for an unpublished watch', () => {
    // The public detail endpoint filters to PUBLIC, so an unpublished watch has
    // no source for its description or specifications. The form must be able to
    // say so rather than showing blanks that look like empty values.
    const { result } = renderHook(() => useWatchRecord('watch-1'), { wrapper: wrapper(seededClient()) });
    expect(result.current.detailUnavailable).toBe(true);
    expect(result.current.seed?.description).toBe('');
  });

  it('reports that it is still seeding while the list has not arrived', () => {
    // Regression test. Without this flag the edit route rendered blank,
    // editable fields, and the seeding effect then called `reset()` and
    // discarded whatever the operator had typed into them.
    const empty = new QueryClient({ defaultOptions: { queries: { retry: false, enabled: false } } });
    const { result } = renderHook(() => useWatchRecord('watch-1'), { wrapper: wrapper(empty) });

    expect(result.current.isSeeding).toBe(true);
    expect(result.current.seed).toBeUndefined();
  });

  it('stops seeding once the record has loaded', () => {
    const { result } = renderHook(() => useWatchRecord('watch-1'), { wrapper: wrapper(seededClient()) });
    expect(result.current.isSeeding).toBe(false);
  });

  it('stops seeding when the watch turns out not to exist', () => {
    // Otherwise the page would spin forever instead of reaching its
    // "that watch no longer exists" branch.
    const { result } = renderHook(() => useWatchRecord('does-not-exist'), { wrapper: wrapper(seededClient()) });
    expect(result.current.isSeeding).toBe(false);
    expect(result.current.existing).toBeUndefined();
  });

  it('produces no seed at all when creating rather than editing', () => {
    const { result } = renderHook(() => useWatchRecord(undefined), { wrapper: wrapper(seededClient()) });
    expect(result.current.seed).toBeUndefined();
    expect(result.current.detailUnavailable).toBe(false);
    // The create form must be interactive immediately.
    expect(result.current.isSeeding).toBe(false);
  });
});
