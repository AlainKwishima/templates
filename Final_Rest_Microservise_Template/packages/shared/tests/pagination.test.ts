import fc from 'fast-check';
import { buildPaginatedResult, paginate } from '../src/pagination';

describe('pagination helpers', () => {
  it('computes consistent metadata for any valid inputs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 0, max: 10000 }),
        (page, limit, total) => {
          const result = buildPaginatedResult(Array.from({ length: Math.min(limit, total) }), total, page, limit);
          expect(result.page).toBe(page);
          expect(result.limit).toBe(limit);
          expect(result.total).toBe(total);
          expect(result.totalPages).toBe(Math.ceil(total / limit));
          expect(result.data.length).toBeLessThanOrEqual(limit);
        },
      ),
    );
  });

  it('normalizes skip/take correctly', () => {
    expect(paginate(3, 10)).toEqual({ page: 3, limit: 10, skip: 20, take: 10 });
  });
});

