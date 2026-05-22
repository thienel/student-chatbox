import axiosInstance from './axiosInstance';
import type { ApiResponse, Subject, PaginatedResponse } from '../types';

interface CreateSubjectRequest {
  code: string;
  name: string;
  description?: string;
}

interface UpdateSubjectRequest {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
}

interface AssignLecturerRequest {
  lecturerId: string;
}

export const subjectsApi = {
  create: (data: CreateSubjectRequest) =>
    axiosInstance.post<ApiResponse<Subject>>('/subjects', data),

  list: () =>
    axiosInstance.get<ApiResponse<PaginatedResponse<Subject>>>('/subjects'),

  getById: (id: string) =>
    axiosInstance.get<ApiResponse<Subject>>(`/subjects/${id}`),

  update: (id: string, data: UpdateSubjectRequest) =>
    axiosInstance.patch<ApiResponse<Subject>>(`/subjects/${id}`, data),

  delete: (id: string) =>
    axiosInstance.delete(`/subjects/${id}`),

  assignLecturer: (subjectId: string, data: AssignLecturerRequest) =>
    axiosInstance.post(`/subjects/${subjectId}/lecturers`, data),

  removeLecturer: (subjectId: string, lecturerId: string) =>
    axiosInstance.delete(`/subjects/${subjectId}/lecturers/${lecturerId}`),

  enroll: (subjectId: string) =>
    axiosInstance.post(`/subjects/${subjectId}/enroll`),

  unenroll: (subjectId: string) =>
    axiosInstance.delete(`/subjects/${subjectId}/enroll`),
};
