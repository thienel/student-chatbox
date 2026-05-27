import axiosInstance from '@/api/axiosInstance'
import type { ApiResponse, PaginatedResponse, SystemSetting, AuditLog, AdminStats } from '@/types'

export const systemApi = {
  getSettings: () =>
    axiosInstance.get<ApiResponse<SystemSetting[]>>('/system/settings').then(r => r.data.data),

  updateSettings: (settings: Record<string, string>) =>
    axiosInstance.patch('/system/settings', settings),

  getAuditLogs: (params?: { page?: number; limit?: number }) =>
    axiosInstance.get<ApiResponse<PaginatedResponse<AuditLog>>>('/system/audit-logs', { params }).then(r => r.data.data),

  getStats: () =>
    axiosInstance.get<ApiResponse<AdminStats>>('/system/stats').then(r => r.data.data),
}
