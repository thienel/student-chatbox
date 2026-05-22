import axiosInstance from './axiosInstance';
import type { ApiResponse, User } from '../types';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

interface RefreshResponse {
  accessToken: string;
}

export const authApi = {
  login: (data: LoginRequest) =>
    axiosInstance.post<ApiResponse<LoginResponse>>('/auth/login', data),

  refresh: (refreshToken: string) =>
    axiosInstance.post<ApiResponse<RefreshResponse>>('/auth/refresh', { refreshToken }),

  logout: (refreshToken: string) =>
    axiosInstance.post('/auth/logout', { refreshToken }),

  me: () => axiosInstance.get<ApiResponse<User>>('/auth/me'),
};
