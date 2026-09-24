import { afterEach, describe, expect, it, vi } from 'vitest';
import { listWatches, updateWatch } from './watches';

/**
 * The reason this normalisation exists: `pg` returns Postgres `numeric` columns
 * as strings. Without coercion, `publicPrice` is `"4200.00"` and every price
 * comparison, sort and format downstream is subtly wrong.
 */

function mockJson(body: unknown) {
  return vi.fn().mockResolvedValue({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify(body)) });
}

afterEach(() => vi.restoreAllMocks());

describe('listWatches', () => {
  it('coerces a string numeric price into a number', async () => {
    vi.stubGlobal(
      'fetch',
      mockJson({
        data: [
          {
            id: '1', slug: 'omega-seamaster', name: 'Seamaster 300', brand: 'Omega',
            reference: null, publicPrice: '4200.00', availability: 'AVAILABLE',
            visibility: 'PUBLIC', featured: true, createdAt: '2026-01-01T00:00:00Z',
          },
        ],
      }),
    );

    const [watch] = await listWatches();
    expect(watch?.publicPrice).toBe(4200);
    expect(watch?.reference).toBeNull();
  });

  it('keeps a null price null rather than turning it into zero', async () => {
    // "Price on request" and "free" are different facts and must stay distinct.
    vi.stubGlobal('fetch', mockJson({ data: [{ id: '1', publicPrice: null, availability: 'AVAILABLE' }] }));
    const [watch] = await listWatches();
    expect(watch?.publicPrice).toBeNull();
  });

  it('falls back instead of throwing when the API sends an unknown enum value', async () => {
    // A member added backend-first must not crash a table row.
    vi.stubGlobal('fetch', mockJson({ data: [{ id: '1', availability: 'ON_CONSIGNMENT', visibility: 'PUBLIC' }] }));
    const [watch] = await listWatches();
    expect(watch?.availability).toBe('UNAVAILABLE');
  });
});

describe('updateWatch', () => {
  it('sends only the fields that carry a value', async () => {
    // The API's SQL is built on COALESCE($n, column): an omitted key means
    // "leave it alone", so sending explicit undefined keys would be wrong.
    const fetchMock = mockJson({ data: { id: '1', availability: 'RESERVED' } });
    vi.stubGlobal('fetch', fetchMock);

    // Cast because `exactOptionalPropertyTypes` forbids explicit undefined —
    // which is exactly the shape a partially-filled form object produces.
    await updateWatch('1', { availability: 'RESERVED', name: undefined, featured: undefined } as never);

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    // The client always serialises JSON, so the body is a string here.
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body).toEqual({ availability: 'RESERVED' });
  });
});
