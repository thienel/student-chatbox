import axiosInstance from '@/api/axiosInstance'
import type { ApiResponse, PaginatedResponse, User } from '@/types'

export const usersApi = {
  list: (params?: { page?: number; limit?: number; role?: string; search?: string }) =>
    axiosInstance.get<ApiResponse<PaginatedResponse<User>>>('/users', { params }).then(r => r.data.data),

  get: (id: string) =>
    axiosInstance.get<ApiResponse<User>>(`/users/${id}`).then(r => r.data.data),

  create: (data: { email: string; temporaryPassword: string; fullName: string; role: string }) =>
    axiosInstance.post<ApiResponse<User>>('/users', data).then(r => r.data.data),

  update: (id: string, data: Partial<Pick<User, 'fullName'>>) =>
    axiosInstance.patch<ApiResponse<User>>(`/users/${id}`, data).then(r => r.data.data),

  updateStatus: (id: string, status: 'active' | 'suspended', reason?: string) =>
    axiosInstance.patch(`/users/${id}/status`, { status, reason }),

  resetPassword: (id: string, newPassword: string) =>
    axiosInstance.post(`/users/${id}/reset-password`, { newPassword }),
}
