import axiosInstance from './axiosInstance';
import type { ApiResponse, User, PaginatedResponse } from '../types';

interface CreateUserRequest {
  email: string;
  fullName: string;
  role: 'admin' | 'lecturer' | 'student';
  temporaryPassword: string;
}

interface UpdateUserRequest {
  fullName?: string;
  role?: 'admin' | 'lecturer' | 'student';
}

interface UpdateStatusRequest {
  status: 'active' | 'suspended';
  reason?: string;
}

interface ResetPasswordRequest {
  newPassword: string;
}

interface ListUsersParams {
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export const usersApi = {
  create: (data: CreateUserRequest) =>
    axiosInstance.post<ApiResponse<User>>('/users', data),

  list: (params?: ListUsersParams) =>
    axiosInstance.get<ApiResponse<PaginatedResponse<User>>>('/users', { params }),

  getById: (id: string) =>
    axiosInstance.get<ApiResponse<User>>(`/users/${id}`),

  update: (id: string, data: UpdateUserRequest) =>
    axiosInstance.patch<ApiResponse<User>>(`/users/${id}`, data),

  updateStatus: (id: string, data: UpdateStatusRequest) =>
    axiosInstance.patch<ApiResponse<User>>(`/users/${id}/status`, data),

  resetPassword: (id: string, data: ResetPasswordRequest) =>
    axiosInstance.post(`/users/${id}/reset-password`, data),
};
