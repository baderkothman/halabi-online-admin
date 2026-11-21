import { describe, expect, it } from 'vitest';
import { computeInsights, TREND_DAYS } from './insights';
import type { AdminWatchListItem, InquiryListItem } from '@/types/domain';

const NOW = new Date(2026, 10, 21, 15, 0, 0); // 21 Nov 2026, local time

const inquiry = (overrides: Partial<InquiryListItem>): InquiryListItem => ({
  id: Math.random().toString(36), customerName: 'Maya', email: null, phone: null, status: 'NEW',
  createdAt: new Date(2026, 10, 21, 9).toISOString(), watchSlug: 'seamaster', watchName: 'Seamaster 300',
  watchBrand: 'Omega', unreadCount: 0, ...overrides,
});

const watch = (overrides: Partial<AdminWatchListItem>): AdminWatchListItem => ({
  id: Math.random().toString(36), slug: 's', name: 'Calatrava', brand: 'Patek Philippe', reference: null,
  publicPrice: 1000, availability: 'AVAILABLE', visibility: 'PUBLIC', featured: false,
  createdAt: '2026-11-01T00:00:00Z', images: [{ url: 'https://x/y.jpg', alt: '', isPrimary: true }],
  ...overrides,
});

describe('computeInsights', () => {
  it('buckets inquiries into the last 30 local days, today last', () => {
    const result = computeInsights(
      [
        inquiry({}),
        inquiry({ createdAt: new Date(2026, 10, 20, 23, 30).toISOString() }),
        inquiry({ createdAt: new Date(2026, 10, 20, 8).toISOString() }),
      ],
      [],
      NOW,
    );
    expect(result.trend).toHaveLength(TREND_DAYS);
    expect(result.trend.at(-1)).toEqual({ day: '2026-11-21', count: 1 });
    expect(result.trend.at(-2)).toEqual({ day: '2026-11-20', count: 2 });
    expect(result.last30).toBe(3);
  });

  it('counts the previous 30 days separately and ignores older inquiries', () => {
    const result = computeInsights(
      [
        inquiry({ createdAt: new Date(2026, 9, 10).toISOString() }), // 42 days ago: previous window
        inquiry({ createdAt: new Date(2026, 5, 1).toISOString() }), // far older: neither
      ],
      [],
      NOW,
    );
    expect(result.last30).toBe(0);
    expect(result.previous30).toBe(1);
  });

  it('reports the pipeline and the conversion rate of resolved inquiries', () => {
    const result = computeInsights(
      [inquiry({ status: 'NEW' }), inquiry({ status: 'IN_DISCUSSION' }), inquiry({ status: 'CONVERTED' }), inquiry({ status: 'CLOSED' }), inquiry({ status: 'CLOSED' })],
      [],
      NOW,
    );
    expect(result.pipeline.find((entry) => entry.status === 'NEW')?.count).toBe(1);
    expect(result.pipeline.find((entry) => entry.status === 'IN_DISCUSSION')?.count).toBe(1);
    expect(result.resolved).toBe(3);
    expect(result.conversionRate).toBeCloseTo(1 / 3);
    expect(computeInsights([inquiry({})], [], NOW).conversionRate).toBeNull();
  });

  it('ranks the most inquired watches', () => {
    const result = computeInsights(
      [inquiry({}), inquiry({}), inquiry({ watchSlug: 'datejust', watchName: 'Datejust', watchBrand: 'Rolex' })],
      [],
      NOW,
    );
    expect(result.topWatches.map((entry) => [entry.name, entry.count])).toEqual([['Seamaster 300', 2], ['Datejust', 1]]);
  });

  it('flags catalogue gaps only on pieces that are still for sale', () => {
    const result = computeInsights(
      [],
      [
        watch({ name: 'No photo', images: [] }),
        watch({ name: 'No price', publicPrice: null }),
        watch({ name: 'Hidden', visibility: 'PRIVATE' }),
        watch({ name: 'Sold, no photo', availability: 'SOLD', images: [] }),
        watch({ name: 'Archived, hidden', availability: 'ARCHIVED', visibility: 'PRIVATE' }),
      ],
      NOW,
    );
    expect(result.attention.noPhoto.map((item) => item.name)).toEqual(['No photo']);
    expect(result.attention.noPrice.map((item) => item.name)).toEqual(['No price']);
    expect(result.attention.unpublished.map((item) => item.name)).toEqual(['Hidden']);
  });
});
