import axiosInstance from '@/api/axiosInstance'
import type { ApiResponse } from '@/types'

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

export const allowlistApi = {
  list: (params?: { search?: string; status?: string; limit?: number; offset?: number }) =>
    axiosInstance.get<ApiResponse<AllowlistListResponse>>('/admin/student-email-allowlist', { params }).then(r => r.data.data),

  create: (data: { personalEmail: string; studentCode: string }) =>
    axiosInstance.post<ApiResponse<AllowlistRecord>>('/admin/student-email-allowlist', data).then(r => r.data.data),

  bulkImport: (data: { records: { personalEmail: string; studentCode: string }[] }) =>
    axiosInstance.post<ApiResponse<{ importedCount: number }>>('/admin/student-email-allowlist/bulk', data).then(r => r.data.data),

  enable: (id: string) =>
    axiosInstance.put<ApiResponse<AllowlistRecord>>(`/admin/student-email-allowlist/${id}/enable`).then(r => r.data.data),

  disable: (id: string) =>
    axiosInstance.put<ApiResponse<AllowlistRecord>>(`/admin/student-email-allowlist/${id}/disable`).then(r => r.data.data),
}
