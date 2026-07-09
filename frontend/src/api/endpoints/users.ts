import axiosInstance from '@/api/axiosInstance'
import type { ApiResponse, PaginatedResponse, User, CreateUserRequest } from '@/types'

export const usersApi = {
  list: (params?: { page?: number; limit?: number; role?: string; status?: string; search?: string }) =>
    axiosInstance.get<ApiResponse<PaginatedResponse<User>>>('/users', { params }).then(r => r.data.data),

  get: (id: string) =>
    axiosInstance.get<ApiResponse<User>>(`/users/${id}`).then(r => r.data.data),

  create: (data: CreateUserRequest) =>
    axiosInstance.post<ApiResponse<User>>('/users', data).then(r => r.data.data),

  update: (id: string, data: Partial<Pick<User, 'fullName'>>) =>
    axiosInstance.patch<ApiResponse<User>>(`/users/${id}`, data).then(r => r.data.data),

  updateStatus: (id: string, status: 'active' | 'suspended' | 'rejected' | 'pending_email_verification' | 'pending_manual_verification', reason?: string) =>
    axiosInstance.patch(`/users/${id}/status`, { status, reason }),

  resetPassword: (id: string, newPassword: string) =>
    axiosInstance.post(`/users/${id}/reset-password`, { newPassword }),

  // Admin Verification Endpoints
  getPendingVerifications: () =>
    axiosInstance.get<ApiResponse<import('@/types').StudentVerificationRequest[]>>('/admin/student-verifications').then(r => r.data.data),

  getVerificationDetail: (id: string) =>
    axiosInstance.get<ApiResponse<import('@/types').StudentVerificationRequest>>(`/admin/student-verifications/${id}`).then(r => r.data.data),

  approveVerification: (id: string) =>
    axiosInstance.patch<ApiResponse<{ message: string; code: string }>>(`/admin/student-verifications/${id}/approve`).then(r => r.data),

  rejectVerification: (id: string, reason: string) =>
    axiosInstance.patch<ApiResponse<{ message: string; code: string }>>(`/admin/student-verifications/${id}/reject`, { reason }).then(r => r.data),

  requestMoreInfoVerification: (id: string, reason: string) =>
    axiosInstance.patch<ApiResponse<{ message: string; code: string }>>(`/admin/student-verifications/${id}/request-more-info`, { reason }).then(r => r.data),
}
