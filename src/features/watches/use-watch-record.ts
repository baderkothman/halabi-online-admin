import { useMemo } from 'react';
import { useCategories, useWatchDetail, useWatches } from './queries';
import type { WatchFormValues } from './schema';
import type { AdminWatchListItem, Category } from '@/types/domain';

/**
 * Assembles the record the edit form needs, from the two endpoints that exist.
 *
 * There is no admin watch-detail endpoint, so a watch's fields come from:
 *
 *  - the admin LIST, which carries the core fields and images but not the
 *    description, specifications or category;
 *  - the PUBLIC detail endpoint, which carries the rest but only for watches
 *    whose visibility is `PUBLIC`.
 *
 * An unpublished watch therefore has no source for the second group. That is
 * surfaced as `detailUnavailable` so the form can say so, rather than showing
 * blank fields that look like empty values. See docs/API-INTEGRATION.md.
 */

export interface WatchRecord {
  existing: AdminWatchListItem | undefined;
  categories: Category[];
  categoriesLoading: boolean;
  categoriesFailed: boolean;
  /** The form values to seed with, or `undefined` while still loading. */
  seed: WatchFormValues | undefined;
  /** True when fields exist on the server that this form could not load. */
  detailUnavailable: boolean;
  /**
   * The record is still being fetched. The form MUST NOT be interactive while
   * this is true: seeding calls `reset()`, which would discard anything the
   * operator had already typed into the blank fields.
   */
  isSeeding: boolean;
  /** The list request failed — the form cannot show anything meaningful. */
  listError: unknown;
  isListError: boolean;
  isListSuccess: boolean;
  refetchList: () => void;
}

export function useWatchRecord(id: string | undefined): WatchRecord {
  const isEdit = Boolean(id);
  const watches = useWatches();
  const categories = useCategories();

  const existing = isEdit ? watches.data?.find((item) => item.id === id) : undefined;
  const isPublished = existing?.visibility === 'PUBLIC';
  const detail = useWatchDetail(isEdit && isPublished ? existing?.slug : undefined);

  // Withhold the seed until the detail request settles, or the form's dirty
  // baseline would be the half-populated version and the unsaved-changes guard
  // would fire the moment the description arrived.
  const ready = Boolean(existing) && !(isPublished && detail.isPending);
  const full = detail.data;

  // Memoised on identity, not value: the consumer seeds the form from this in
  // an effect, and a fresh object every render would reset the form — wiping
  // whatever the operator had typed — on each keystroke.
  const seed = useMemo<WatchFormValues | undefined>(
    () =>
      existing && ready
        ? {
            name: existing.name,
            brand: existing.brand,
            slug: existing.slug,
            reference: existing.reference ?? '',
            description: full?.description ?? '',
            publicPrice: existing.publicPrice ?? '',
            condition: full?.condition ?? '',
            movement: full?.movement ?? '',
            caseMaterial: full?.caseMaterial ?? '',
            dialColor: full?.dialColor ?? '',
            categoryId: '',
            availability: existing.availability,
            visibility: existing.visibility,
            featured: existing.featured,
            images: existing.images.map((image) => ({
              url: image.url,
              alt: image.alt,
              isPrimary: image.isPrimary,
            })),
          }
        : undefined,
    [existing, ready, full],
  );

  // Not simply `!seed`: once the list has loaded and the watch is genuinely
  // missing, there is nothing left to wait for and the page shows its
  // "no longer exists" branch instead.
  const isSeeding =
    isEdit && !seed && !watches.isError && !(watches.isSuccess && !existing);

  return {
    existing,
    categories: categories.data ?? [],
    categoriesLoading: categories.isPending,
    categoriesFailed: categories.isError,
    seed,
    detailUnavailable: isEdit && Boolean(existing) && !isPublished,
    isSeeding,
    listError: watches.error,
    isListError: watches.isError,
    isListSuccess: watches.isSuccess,
    refetchList: () => void watches.refetch(),
  };
}
