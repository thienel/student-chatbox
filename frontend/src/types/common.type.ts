export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page?: number;
  limit?: number;
}

export interface AllowlistRecordInput { email?: string; note?: string; isActive?: boolean; personalEmail?: string; studentCode?: string; }
export interface BulkImportAllowlistRequest { records: AllowlistRecordInput[] }