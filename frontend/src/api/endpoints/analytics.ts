import axiosInstance from '@/api/axiosInstance'
import type { ApiResponse, AdminStats, AiUsageStats } from '@/types'

export const analyticsApi = {
  overview: () =>
    axiosInstance.get<ApiResponse<AdminStats>>('/analytics/overview').then(r => r.data.data),

  aiUsage: () =>
    axiosInstance.get<ApiResponse<AiUsageStats>>('/analytics/ai-usage').then(r => r.data.data),
}
