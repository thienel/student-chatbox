import axiosInstance from '@/api/axiosInstance'
import type { ApiResponse, PaginatedResponse, Subject, Document } from '@/types'

export const subjectsApi = {
  list: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
    axiosInstance.get<ApiResponse<PaginatedResponse<Subject>>>('/subjects', { params }).then(r => r.data.data),

  get: (id: string) =>
    axiosInstance.get<ApiResponse<Subject>>(`/subjects/${id}`).then(r => r.data.data),

  create: (data: { code: string; name: string; description?: string }) =>
    axiosInstance.post<ApiResponse<Subject>>('/subjects', data).then(r => r.data.data),

  update: (id: string, data: Partial<Pick<Subject, 'name' | 'description' | 'status'>>) =>
    axiosInstance.patch<ApiResponse<Subject>>(`/subjects/${id}`, data).then(r => r.data.data),

  delete: (id: string) =>
    axiosInstance.delete(`/subjects/${id}`),

  assignLecturer: (subjectId: string, lecturerId: string) =>
    axiosInstance.post(`/subjects/${subjectId}/lecturers`, { lecturerId }),

  removeLecturer: (subjectId: string, lecturerId: string) =>
    axiosInstance.delete(`/subjects/${subjectId}/lecturers/${lecturerId}`),

  // Documents form a per lecturer+subject knowledge base; the backend resolves
  // the lecturer from the caller (students via their enrolled class).
  getDocuments: (subjectId: string) =>
    axiosInstance.get<ApiResponse<{ items: Document[]; total: number }>>(`/subjects/${subjectId}/documents`)
      .then(r => r.data.data.items),

  uploadDocument: (subjectId: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return axiosInstance.post<ApiResponse<Document>>(`/subjects/${subjectId}/documents`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data.data)
  },

  deleteDocument: (subjectId: string, documentId: string) =>
    axiosInstance.delete(`/subjects/${subjectId}/documents/${documentId}`),
}
