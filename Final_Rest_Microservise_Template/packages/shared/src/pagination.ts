export interface PaginationInput {
  page?: number;
  limit?: number;
}

export const normalizePagination = ({ page = 1, limit = 10 }: PaginationInput = {}) => {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(100, Math.floor(limit)) : 10;

  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
    take: safeLimit,
  };
};

export const paginate = (page = 1, limit = 10) => normalizePagination({ page, limit });

export const buildPaginatedResult = <T>(
  data: T[],
  total: number,
  page = 1,
  limit = 10,
) => {
  const normalized = normalizePagination({ page, limit });
  return {
    data,
    page: normalized.page,
    limit: normalized.limit,
    total,
    totalPages: Math.ceil(total / normalized.limit),
  };
};

