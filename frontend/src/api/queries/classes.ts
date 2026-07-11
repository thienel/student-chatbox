import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { classesApi } from '@/api/endpoints/classes'
import { queryKeys } from '@/api/queryKeys'
import type { CreateClassRequest, EnrollClassRequest } from '@/types'

export const useClasses = (subjectId: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.classes.list(subjectId),
    queryFn: () => classesApi.list(subjectId),
    enabled: !!subjectId && enabled,
  })
}

export const useSubjectLecturers = (subjectId: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.classes.lecturers(subjectId),
    queryFn: () => classesApi.lecturers(subjectId),
    enabled: !!subjectId && enabled,
  })
}

export const useAvailableClasses = (subjectId: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.classes.availableClasses(subjectId),
    queryFn: () => classesApi.availableClasses(subjectId),
    enabled: !!subjectId && enabled,
  })
}

export const useMyClass = (subjectId: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.classes.myClass(subjectId),
    queryFn: () => classesApi.myClass(subjectId),
    enabled: !!subjectId && enabled,
  })
}

export const useClassStudents = (subjectId: string, classId?: string) => {
  return useQuery({
    queryKey: queryKeys.classes.students(subjectId, classId ?? ''),
    queryFn: () => classesApi.students(subjectId, classId!),
    enabled: !!subjectId && !!classId,
  })
}

export const useClassStats = (subjectId: string, classId?: string) => {
  return useQuery({
    queryKey: queryKeys.classes.stats(subjectId, classId ?? ''),
    queryFn: () => classesApi.stats(subjectId, classId!),
    enabled: !!subjectId && !!classId,
  })
}

export const useClassEngagement = (subjectId: string, classId?: string) => {
  return useQuery({
    queryKey: queryKeys.classes.engagement(subjectId, classId ?? ''),
    queryFn: () => classesApi.engagement(subjectId, classId!),
    enabled: !!subjectId && !!classId,
  })
}

export const useStudentEngagement = (subjectId: string, classId: string | undefined, studentId: string | null) => {
  return useQuery({
    queryKey: queryKeys.classes.studentEngagement(subjectId, classId ?? '', studentId ?? ''),
    queryFn: () => classesApi.studentEngagement(subjectId, classId!, studentId!),
    enabled: !!subjectId && !!classId && !!studentId,
  })
}

export const useRemoveClassStudent = (subjectId: string, classId?: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (studentId: string) => classesApi.removeStudent(subjectId, classId!, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.students(subjectId, classId ?? '') })
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.stats(subjectId, classId ?? '') })
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.list(subjectId) })
    },
  })
}

export const useCreateClass = (subjectId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateClassRequest) => classesApi.create(subjectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.list(subjectId) })
    },
  })
}

export const useEnroll = (subjectId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: EnrollClassRequest) => classesApi.enroll(subjectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.myClass(subjectId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects.all })
    },
  })
}

export const useUnenroll = (subjectId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => classesApi.unenroll(subjectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.myClass(subjectId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects.all })
    },
  })
}
