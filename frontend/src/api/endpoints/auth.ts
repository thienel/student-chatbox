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

  me: () =>
    axiosInstance.get<ApiResponse<User>>('/auth/me').then(r => r.data.data),

  logout: (refreshToken: string) =>
    axiosInstance.post('/auth/logout', { refreshToken }),
}
