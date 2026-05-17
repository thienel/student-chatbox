export class PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;

  constructor(page: number, limit: number, total: number) {
    this.page = page;
    this.limit = limit;
    this.total = total;
    this.totalPages = Math.ceil(total / limit);
  }
}

export class PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;

  constructor(items: T[], page: number, limit: number, total: number) {
    this.items = items;
    this.meta = new PaginationMeta(page, limit, total);
  }
}
