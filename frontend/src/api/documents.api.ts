import axiosInstance from './axiosInstance';
import type { ApiResponse, Document } from '../types';

interface DocumentListResponse {
  items: Document[];
  total: number;
}

export const documentsApi = {
  upload: (subjectId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post<ApiResponse<Document>>(
      `/subjects/${subjectId}/documents`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },

  list: (subjectId: string) =>
    axiosInstance.get<ApiResponse<DocumentListResponse>>(`/subjects/${subjectId}/documents`),

  delete: (subjectId: string, documentId: string) =>
    axiosInstance.delete(`/subjects/${subjectId}/documents/${documentId}`),
};
