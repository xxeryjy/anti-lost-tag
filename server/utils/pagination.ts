import type { PaginationMeta } from '~/types/smarttag'

interface PaginationQuery {
  page?: unknown
  pageSize?: unknown
}

export function parsePaginationQuery(query: PaginationQuery, defaultPageSize = 20) {
  const page = Math.max(1, Number(query.page) || 1)
  const requestedPageSize = Number(query.pageSize) || defaultPageSize
  const pageSize = Math.min(100, Math.max(1, requestedPageSize))

  return {
    page,
    pageSize
  }
}

export function paginateItems<T>(items: T[], page: number, pageSize: number) {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * pageSize
  const pagedItems = items.slice(start, start + pageSize)
  const pagination: PaginationMeta = {
    page: safePage,
    pageSize,
    total,
    totalPages
  }

  return {
    items: pagedItems,
    list: pagedItems,
    pagination
  }
}
