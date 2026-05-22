import axiosInstance from './axiosInstance';
import type { ApiResponse, Chat, Message } from '../types';

interface CreateChatRequest {
  subjectId: string;
  title?: string;
}

interface ChatDetailResponse {
  chat: Chat;
  messages: Message[];
}

export const chatApi = {
  create: (data: CreateChatRequest) =>
    axiosInstance.post<ApiResponse<Chat>>('/chats', data),

  list: (subjectId?: string) =>
    axiosInstance.get<ApiResponse<Chat[]>>('/chats', {
      params: subjectId ? { subjectId } : undefined,
    }),

  getById: (id: string) =>
    axiosInstance.get<ApiResponse<ChatDetailResponse>>(`/chats/${id}`),

  delete: (id: string) =>
    axiosInstance.delete(`/chats/${id}`),
};

export const systemApi = {
  getSettings: () =>
    axiosInstance.get<ApiResponse<Record<string, string | number>>>('/system/settings'),

  updateSettings: (data: Record<string, string | number>) =>
    axiosInstance.patch<ApiResponse<Record<string, string | number>>>('/system/settings', data),

  getAuditLogs: (params?: {
    userId?: string;
    action?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) =>
    axiosInstance.get('/system/audit-logs', { params }),

  getStats: () =>
    axiosInstance.get('/system/stats'),
};
