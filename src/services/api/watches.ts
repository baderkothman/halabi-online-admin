import { requestData } from './client';
import { asArray, asRecord, toBoolean, toEnum, toNumberOrNull, toStringOrNull, toText } from '@/lib/coerce';
import {
  WATCH_AVAILABILITY, WATCH_VISIBILITY,
  type AdminWatchListItem, type Category, type WatchDetail, type WatchWriteInput,
} from '@/types/domain';

/**
 * Watch endpoints.
 *
 * Two facts about the current API shape the code here:
 *
 * 1. `GET /admin/dashboard/watches` takes no query parameters and returns the
 *    entire catalogue in one array. Search, filtering, sorting and pagination
 *    are therefore done client-side in the watches feature. That is acceptable
 *    for a single-dealer catalogue of hundreds of pieces and is NOT acceptable
 *    at thousands — the backend requirement is recorded in
 *    docs/API-INTEGRATION.md.
 *
 * 2. There is no admin watch-detail endpoint. Descriptions, category and
 *    specifications are only available from the PUBLIC endpoint by slug,
 *    while images are included in the admin list so unpublished watches can
 *    still be edited.
 */

function toListItem(raw: unknown): AdminWatchListItem {
  const row = asRecord(raw);
  return {
    id: toText(row.id),
    slug: toText(row.slug),
    name: toText(row.name),
    brand: toText(row.brand),
    reference: toStringOrNull(row.reference),
    // `public_price` is a Postgres numeric — `pg` hands it back as a string.
    publicPrice: toNumberOrNull(row.publicPrice),
    availability: toEnum(row.availability, WATCH_AVAILABILITY, 'UNAVAILABLE'),
    visibility: toEnum(row.visibility, WATCH_VISIBILITY, 'PRIVATE'),
    featured: toBoolean(row.featured),
    createdAt: toText(row.createdAt),
    images: asArray(row.images).map(toImage),
  };
}

function toImage(raw: unknown) {
  const image = asRecord(raw);
  return {
    url: toText(image.url),
    alt: toText(image.alt),
    isPrimary: toBoolean(image.isPrimary),
  };
}

export async function listWatches(signal?: AbortSignal): Promise<AdminWatchListItem[]> {
  const data = await requestData<unknown>('/admin/dashboard/watches', signal ? { signal } : {});
  return asArray(data).map(toListItem);
}

export async function createWatch(input: WatchWriteInput): Promise<AdminWatchListItem> {
  // The create response projects only five columns, so the caller gets a
  // partial row back. Query invalidation refills the rest.
  const data = await requestData<unknown>('/admin/dashboard/watches', { method: 'POST', body: prune(input) });
  return toListItem(data);
}

export async function updateWatch(id: string, input: Partial<WatchWriteInput>): Promise<AdminWatchListItem> {
  const data = await requestData<unknown>(`/admin/dashboard/watches/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: prune(input),
  });
  return toListItem(data);
}

/**
 * Drops `undefined` keys before sending.
 *
 * The API runs `ValidationPipe` with `forbidNonWhitelisted: true`, and its
 * update SQL is built on `COALESCE($n, column)` — so an explicit `undefined`
 * serialises to nothing useful while an omitted key correctly means "leave this
 * column alone". Sending only the keys that carry a value is what the contract
 * actually expects.
 */
function prune<T extends object>(input: T): Partial<T> {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) as Partial<T>;
}

function toWatchDetail(raw: unknown): WatchDetail {
  const row = asRecord(raw);
  const category = asRecord(row.category);
  return {
    id: toText(row.id),
    slug: toText(row.slug),
    name: toText(row.name),
    brand: toText(row.brand),
    reference: toStringOrNull(row.reference),
    price: toNumberOrNull(row.price),
    description: toStringOrNull(row.description),
    availability: toEnum(row.availability, WATCH_AVAILABILITY, 'UNAVAILABLE'),
    condition: toStringOrNull(row.condition),
    movement: toStringOrNull(row.movement),
    caseMaterial: toStringOrNull(row.caseMaterial),
    dialColor: toStringOrNull(row.dialColor),
    featured: toBoolean(row.featured),
    category: row.category ? { slug: toText(category.slug), name: toText(category.name) } : null,
    images: asArray(row.images).map(toImage),
    createdAt: toText(row.createdAt),
  };
}

/**
 * Full detail for a watch, via the public catalogue endpoint.
 *
 * Returns `null` for a 404 rather than throwing, because a 404 here is an
 * expected state with a specific meaning — the watch is unpublished, so the
 * public endpoint cannot see it — not an error the user needs to recover from.
 */
export async function getWatchDetail(slug: string, signal?: AbortSignal): Promise<WatchDetail | null> {
  try {
    const data = await requestData<unknown>(
      `/public/watches/${encodeURIComponent(slug)}`,
      signal ? { signal } : {},
    );
    return toWatchDetail(data);
  } catch (error) {
    if (error instanceof Error && error.name === 'NotFoundError') return null;
    throw error;
  }
}

export async function listCategories(signal?: AbortSignal): Promise<Category[]> {
  const data = await requestData<unknown>('/public/categories', signal ? { signal } : {});
  return asArray(data).map((raw) => {
    const row = asRecord(raw);
    return {
      id: toText(row.id),
      slug: toText(row.slug),
      name: toText(row.name),
      description: toStringOrNull(row.description),
    };
  });
}
