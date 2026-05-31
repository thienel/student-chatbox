import axiosInstance from '@/api/axiosInstance'
import type { ApiResponse, Chat, Message } from '@/types'

export const chatsApi = {
  list: (params?: { subjectId?: string }) =>
    axiosInstance.get<ApiResponse<Chat[]>>('/chats', { params }).then(r => r.data.data),

  get: (id: string) =>
    axiosInstance.get<ApiResponse<Chat & { messages: Message[] }>>(`/chats/${id}`).then(r => r.data.data),

  create: (data: { subjectId: string; title?: string }) =>
    axiosInstance.post<ApiResponse<Chat>>('/chats', data).then(r => r.data.data),

  delete: (id: string) =>
    axiosInstance.delete(`/chats/${id}`),
}
