export type PaginationParams = {
  page: number;
  limit: number;
};

export function parsePagination(searchParams: URLSearchParams): PaginationParams {
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "10");

  return {
    page: Number.isFinite(page) && page > 0 ? Math.floor(page) : 1,
    limit:
      Number.isFinite(limit) && limit > 0 && limit <= 100
        ? Math.floor(limit)
        : 10,
  };
}

export function createPaginationMeta(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
