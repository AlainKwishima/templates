import { buildPaginatedResult, paginate } from './pagination';

describe('pagination helpers', () => {
  it('calculates skip and take correctly', () => {
    expect(paginate({ page: 2, limit: 10 })).toEqual({ skip: 10, take: 10 });
  });

  it('builds paginated result with correct totalPages', () => {
    const result = buildPaginatedResult(['a', 'b'], 25, { page: 2, limit: 10 });
    expect(result.data).toHaveLength(2);
    expect(result.page).toBe(2);
    expect(result.limit).toBe(10);
    expect(result.total).toBe(25);
    expect(result.totalPages).toBe(3);
  });
});
