export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const paginate = (params: PaginationParams): { skip: number; take: number } => {
  const page = Math.max(1, params.page);
  const limit = Math.max(1, params.limit);
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
};

export const buildPaginatedResult = <T>(
  data: T[],
  total: number,
  params: PaginationParams,
): PaginatedResult<T> => {
  const page = Math.max(1, params.page);
  const limit = Math.max(1, params.limit);
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  return {
    data,
    page,
    limit,
    total,
    totalPages,
  };
};

export const paginationMeta = (result: PaginatedResult<unknown>): Record<string, number> => ({
  page: result.page,
  limit: result.limit,
  total: result.total,
  totalPages: result.totalPages,
});
