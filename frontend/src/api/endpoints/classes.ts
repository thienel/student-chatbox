import axiosInstance from '@/api/axiosInstance'
import type { ApiResponse, Class, SubjectLecturer } from '@/types'

export const classesApi = {
  // Lecturer/admin: classes in a subject (own classes for lecturers).
  list: (subjectId: string) =>
    axiosInstance
      .get<ApiResponse<Class[]>>(`/subjects/${subjectId}/classes`)
      .then(r => r.data.data),

  create: (subjectId: string, data: { name: string; password: string }) =>
    axiosInstance
      .post<ApiResponse<Class>>(`/subjects/${subjectId}/classes`, data)
      .then(r => r.data.data),

  // Student: lecturers that have at least one class (for the enroll dropdown).
  lecturers: (subjectId: string) =>
    axiosInstance
      .get<ApiResponse<SubjectLecturer[]>>(`/subjects/${subjectId}/lecturers`)
      .then(r => r.data.data),

  // Student: the class they belong to in a subject (null if not enrolled).
  myClass: (subjectId: string) =>
    axiosInstance
      .get<ApiResponse<Class | null>>(`/subjects/${subjectId}/my-class`)
      .then(r => r.data.data),

  enroll: (subjectId: string, data: { lecturerId: string; password: string }) =>
    axiosInstance.post(`/subjects/${subjectId}/enroll`, data),

  unenroll: (subjectId: string) =>
    axiosInstance.delete(`/subjects/${subjectId}/enroll`),
}
