import axiosInstance from '@/api/axiosInstance'
import type { ApiResponse, User } from '@/types'

interface LoginResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export const authApi = {
  login: (email: string, password: string) =>
    axiosInstance.post<ApiResponse<LoginResponse>>('/auth/login', { email, password }).then(r => r.data.data),

  register: (email: string, password: string, fullName: string) =>
    axiosInstance.post<ApiResponse<any>>('/auth/register', { email, password, fullName }).then(r => r.data),

  verifyOtp: (email: string, otp: string) =>
    axiosInstance.post<ApiResponse<any>>('/auth/verify-otp', { email, otp }).then(r => r.data),

  resendOtp: (email: string) =>
    axiosInstance.post<ApiResponse<any>>('/auth/resend-otp', { email }).then(r => r.data),

  forgotPassword: (email: string) =>
    axiosInstance.post<ApiResponse<any>>('/auth/forgot-password', { email }).then(r => r.data),

  verifyResetOtp: (email: string, otp: string) =>
    axiosInstance.post<ApiResponse<any>>('/auth/verify-reset-otp', { email, otp }).then(r => r.data),

  resetPassword: (email: string, otp: string, newPassword: string) =>
    axiosInstance.post<ApiResponse<any>>('/auth/reset-password', { email, otp, newPassword }).then(r => r.data),

  me: () =>
    axiosInstance.get<ApiResponse<User>>('/auth/me').then(r => r.data.data),

  logout: (refreshToken: string) =>
    axiosInstance.post('/auth/logout', { refreshToken }),
}
