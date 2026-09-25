import type { InquiryStatus } from '@/types/domain';

/**
 * Every query key in the application.
 *
 * Keys are declared here, as `as const` tuples, so that invalidation can be
 * written against a shared prefix and cannot silently miss a cache entry
 * because two files spelled the same key differently. The hierarchy matters:
 * invalidating `queryKeys.watches.all` also invalidates every filtered list and
 * every detail beneath it.
 */
export const queryKeys = {
  dashboard: {
    all: ['dashboard'] as const,
    summary: () => ['dashboard', 'summary'] as const,
  },

  watches: {
    all: ['watches'] as const,
    list: () => ['watches', 'list'] as const,
    /** Detail is keyed by slug because the only detail endpoint is slug-based. */
    detail: (slug: string) => ['watches', 'detail', slug] as const,
  },

  categories: {
    all: ['categories'] as const,
    list: () => ['categories', 'list'] as const,
  },

  photoJobs: {
    all: ['photo-jobs'] as const,
    /** Every job for one watch, newest first. */
    list: (watchId: string) => ['photo-jobs', 'list', watchId] as const,
    /** The polled key: one job, refetched while it is still running. */
    detail: (id: string) => ['photo-jobs', 'detail', id] as const,
  },

  inquiries: {
    all: ['inquiries'] as const,
    list: (status?: InquiryStatus) => ['inquiries', 'list', status ?? 'ALL'] as const,
    detail: (id: string) => ['inquiries', 'detail', id] as const,
  },
} as const;
