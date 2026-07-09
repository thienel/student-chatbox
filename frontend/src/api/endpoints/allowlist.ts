import axiosInstance from '@/api/axiosInstance'
import type { ApiResponse, AllowlistRecordInput, BulkImportAllowlistRequest } from '@/types'

export interface AllowlistRecord {
  id: string
  personalEmail: string
  studentCode: string
  isClaimed: boolean
  claimedAt: string | null
  claimedByUserId: string | null
  isActive: boolean
  createdAt: string
}

export interface AllowlistListResponse {
  items: AllowlistRecord[]
  total: number
  limit: number
  offset: number
}

// Helper to map backend entity format to frontend AllowlistRecord format
const mapBackendRecord = (backendRecord: any): AllowlistRecord => {
  if (!backendRecord) return {} as AllowlistRecord;
  return {
    id: backendRecord.id,
    personalEmail: backendRecord.email,
    studentCode: backendRecord.studentCode,
    isClaimed: backendRecord.status === 'claimed',
    claimedAt: backendRecord.claimedAt || null,
    claimedByUserId: backendRecord.claimedByUserId || null,
    isActive: backendRecord.status !== 'disabled',
    createdAt: backendRecord.createdAt,
  }
}

export const allowlistApi = {
  list: (params?: { search?: string; status?: string; limit?: number; offset?: number }) =>
    axiosInstance.get<ApiResponse<any>>('/admin/student-email-allowlist', { params })
      .then(r => {
        const raw = r.data.data; // This is the object returned by controller: { data: items, total, page, limit }
        const items = raw.data || [];
        return {
          items: items.map(mapBackendRecord),
          total: raw.total || 0,
          limit: raw.limit || 20,
          offset: raw.page ? (raw.page - 1) * (raw.limit || 20) : 0,
        };
      }),

  create: (data: AllowlistRecordInput) =>
    axiosInstance.post<ApiResponse<any>>('/admin/student-email-allowlist', {
      email: data.personalEmail,
      studentCode: data.studentCode,
    }).then(r => {
      // Backend returns { message, data: record }
      return mapBackendRecord(r.data.data.data);
    }),

  bulkImport: (data: BulkImportAllowlistRequest) =>
    axiosInstance.post<ApiResponse<any>>('/admin/student-email-allowlist/bulk', {
      records: data.records.map(r => ({
        email: r.personalEmail,
        studentCode: r.studentCode,
      }))
    }).then(r => {
      // Backend returns { message, data: { total, inserted, skipped } }
      const result = r.data.data.data;
      return {
        importedCount: result ? result.inserted : 0
      };
    }),

  enable: (id: string) =>
    axiosInstance.put<ApiResponse<any>>(`/admin/student-email-allowlist/${id}/enable`).then(() => {
      // Backend returns { message }
      return {} as AllowlistRecord;
    }),

  disable: (id: string) =>
    axiosInstance.put<ApiResponse<any>>(`/admin/student-email-allowlist/${id}/disable`).then(() => {
      // Backend returns { message }
      return {} as AllowlistRecord;
    }),
}

