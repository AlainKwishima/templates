export interface PaginationInput {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
}

export function normalizePagination(input: PaginationInput) {
  const page = Math.max(1, input.page ?? 1);
  const limit = Math.min(100, Math.max(1, input.limit ?? 20));
  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
    sortBy: input.sortBy,
    sortOrder: input.sortOrder ?? "desc",
    search: input.search?.trim() || undefined,
  };
}

export function buildPageMetadata(page: number, limit: number, total: number) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}
