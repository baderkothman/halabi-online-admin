import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { watchesApi } from '@/services/api';
import { queryKeys } from '@/services/query-keys';
import type { WatchWriteInput } from '@/types/domain';

/**
 * Watch queries and mutations.
 *
 * Invalidation rules, stated once here so no call site has to remember them:
 *
 * - Any write to a watch invalidates `watches.all`, which covers the list and
 *   every detail beneath it.
 * - An availability or visibility change ALSO invalidates `dashboard.all`,
 *   because the summary counts `AVAILABLE AND PUBLIC` watches and the sold
 *   total — both move when either field changes.
 * - Nothing invalidates inquiries: the API has no endpoint that changes an
 *   inquiry as a side effect of a watch write.
 */

export function useWatches() {
  return useQuery({
    queryKey: queryKeys.watches.list(),
    queryFn: ({ signal }) => watchesApi.listWatches(signal),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: ({ signal }) => watchesApi.listCategories(signal),
    // Categories change rarely and are needed by every watch form; refetching
    // them on each mount is pure waste.
    staleTime: 10 * 60_000,
  });
}

/** Full detail, from the public endpoint. `null` means the watch is unpublished. */
export function useWatchDetail(slug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.watches.detail(slug ?? ''),
    queryFn: ({ signal }) => watchesApi.getWatchDetail(slug as string, signal),
    enabled: Boolean(slug),
  });
}

export function useCreateWatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: WatchWriteInput) => watchesApi.createWatch(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.watches.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

export function useUpdateWatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<WatchWriteInput> }) =>
      watchesApi.updateWatch(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.watches.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}
