const DEFAULT_PAGE_SIZE = 100;
const MAX_PAGE_SIZE = 500;

function toPositiveInt(value, fallback) {
  const n = Number.parseInt(value, 10);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

/**
 * Slice `items` into a page and build the `page` metadata block used by the
 * upstream card-type service.
 */
export function paginate(items, query = {}) {
  const pageSizeRequested = Math.min(
    toPositiveInt(query.pageSize, DEFAULT_PAGE_SIZE),
    MAX_PAGE_SIZE
  );
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSizeRequested));
  const currentPage = Math.min(toPositiveInt(query.page, 1), totalPages);

  const start = (currentPage - 1) * pageSizeRequested;
  const data = items.slice(start, start + pageSizeRequested);

  return {
    data,
    page: {
      currentPage,
      pageSizeRequested,
      pageSize: data.length,
      totalItems,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    },
  };
}
