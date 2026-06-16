import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { classesApi } from '@/api/endpoints/classes'
import { subjectKeys } from '@/features/subjects/queries'

export const classKeys = {
  list: (subjectId: string) => ['classes', subjectId] as const,
  lecturers: (subjectId: string) => ['classes', subjectId, 'lecturers'] as const,
  myClass: (subjectId: string) => ['classes', subjectId, 'my-class'] as const,
  students: (subjectId: string, classId: string) =>
    ['classes', subjectId, classId, 'students'] as const,
}

export function useClasses(subjectId: string, enabled = true) {
  return useQuery({
    queryKey: classKeys.list(subjectId),
    queryFn: () => classesApi.list(subjectId),
    enabled: !!subjectId && enabled,
  })
}

export function useSubjectLecturers(subjectId: string, enabled = true) {
  return useQuery({
    queryKey: classKeys.lecturers(subjectId),
    queryFn: () => classesApi.lecturers(subjectId),
    enabled: !!subjectId && enabled,
  })
}

export function useMyClass(subjectId: string, enabled = true) {
  return useQuery({
    queryKey: classKeys.myClass(subjectId),
    queryFn: () => classesApi.myClass(subjectId),
    enabled: !!subjectId && enabled,
  })
}

export function useClassStudents(subjectId: string, classId?: string) {
  return useQuery({
    queryKey: classKeys.students(subjectId, classId ?? ''),
    queryFn: () => classesApi.students(subjectId, classId!),
    enabled: !!subjectId && !!classId,
  })
}

export function useRemoveClassStudent(subjectId: string, classId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (studentId: string) => classesApi.removeStudent(subjectId, classId!, studentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: classKeys.students(subjectId, classId ?? '') })
      qc.invalidateQueries({ queryKey: classKeys.list(subjectId) })
    },
  })
}

export function useCreateClass(subjectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; password: string }) => classesApi.create(subjectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: classKeys.list(subjectId) }),
  })
}

export function useEnroll(subjectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { lecturerId: string; password: string }) =>
      classesApi.enroll(subjectId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: classKeys.myClass(subjectId) })
      qc.invalidateQueries({ queryKey: subjectKeys.all() })
    },
  })
}

export function useUnenroll(subjectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => classesApi.unenroll(subjectId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: classKeys.myClass(subjectId) })
      qc.invalidateQueries({ queryKey: subjectKeys.all() })
    },
  })
}
