export const DEFAULT_PAGE_SIZE = 12;
export const ORDERS_PAGE_SIZE = 10;
export const EARNINGS_PAGE_SIZE = 15;

export function parsePageParam(value: string | string[] | undefined, maxPage = 500): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = Number.parseInt(raw ?? "1", 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, maxPage);
}

export function pageOffset(page: number, pageSize: number): { from: number; to: number } {
  const safePage = Math.max(1, page);
  const from = (safePage - 1) * pageSize;
  const to = from + pageSize - 1;
  return { from, to };
}

export function totalPages(totalCount: number, pageSize: number): number {
  if (totalCount <= 0) return 1;
  return Math.max(1, Math.ceil(totalCount / pageSize));
}
