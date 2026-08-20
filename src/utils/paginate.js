const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

function toPositiveInt(value, fallback) {
  const n = Number.parseInt(value, 10);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

/**
 * Slice `items` the way the card-mgt service does: `offset` is a 1-based page
 * number and `limit` is the page size.
 *
 * The upstream `page` block always reports `totalItems: 0` — that quirk is
 * reproduced here so clients see identical payloads. The real count is exposed
 * separately as `realTotalItems` for the route to put in a debug header.
 */
export function paginate(items, { offset, limit } = {}) {
  const pageSizeRequested = Math.min(toPositiveInt(limit, DEFAULT_LIMIT), MAX_LIMIT);
  const currentPage = toPositiveInt(offset, 1);
  const totalItems = items.length;

  const start = (currentPage - 1) * pageSizeRequested;
  const data = items.slice(start, start + pageSizeRequested);

  return {
    data,
    realTotalItems: totalItems,
    page: {
      currentPage,
      pageSizeRequested,
      pageSize: data.length,
      totalItems: 0,
      totalPages: Math.ceil(totalItems / pageSizeRequested),
    },
  };
}
