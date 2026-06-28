import axiosInstance from '@/api/axiosInstance'
import type { ApiResponse, BadgeDef, MyBadges, EarnedBadge } from '@/types'

export const badgesApi = {
  listCatalogue: () =>
    axiosInstance.get<ApiResponse<BadgeDef[]>>('/badges').then(r => r.data.data),

  getMy: () =>
    axiosInstance.get<ApiResponse<MyBadges>>('/me/badges').then(r => r.data.data),

  getUser: (userId: string) =>
    axiosInstance
      .get<ApiResponse<{ earned: EarnedBadge[]; total: number }>>(`/users/${userId}/badges`)
      .then(r => r.data.data),
}
