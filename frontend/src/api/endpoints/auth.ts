import axiosInstance from '@/api/axiosInstance'
import type { ApiResponse, User } from '@/types'

export interface LoginResponse {
  accessToken: string
}

export interface RegisterResponse {
  message: string
}

export interface VerifyOtpResponse {
  message: string
}

export interface ResendOtpResponse {
  message: string
}

export interface ForgotPasswordResponse {
  message: string
}

export interface VerifyResetOtpResponse {
  message: string
  valid: boolean
}

export interface ResetPasswordResponse {
  message: string
}

export const authApi = {
  login: (email: string, password: string) =>
    axiosInstance.post<ApiResponse<LoginResponse>>('/auth/login', { email, password }).then(r => r.data.data),

  registerStudent: (data: { email: string; password: string; fullName: string; studentCode?: string; campus?: string; reasonForNoFptEmail?: string; studentCardUrl?: string; }) =>
    axiosInstance.post<ApiResponse<RegisterResponse>>('/auth/register/student', data).then(r => r.data),

  verifyOtp: (email: string, otp: string) =>
    axiosInstance.post<ApiResponse<VerifyOtpResponse>>('/auth/verify-email', { email, otp }).then(r => r.data),

  resendOtp: (email: string) =>
    axiosInstance.post<ApiResponse<ResendOtpResponse>>('/auth/resend-otp', { email }).then(r => r.data),

  forgotPassword: (email: string) =>
    axiosInstance.post<ApiResponse<ForgotPasswordResponse>>('/auth/forgot-password', { email }).then(r => r.data),

  verifyResetOtp: (email: string, otp: string) =>
    axiosInstance.post<ApiResponse<VerifyResetOtpResponse>>('/auth/verify-reset-otp', { email, otp }).then(r => r.data),

  resetPassword: (email: string, otp: string, newPassword: string) =>
    axiosInstance.post<ApiResponse<ResetPasswordResponse>>('/auth/reset-password', { email, otp, newPassword }).then(r => r.data),

  me: () =>
    axiosInstance.get<ApiResponse<any>>('/auth/me').then(r => {
      const u = r.data.data
      if (u.roleName && !u.role) u.role = u.roleName
      return u as User
    }),

  logout: () =>
    axiosInstance.post('/auth/logout', {}, { withCredentials: true }),
}
