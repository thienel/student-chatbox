import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { subjectsApi } from '@/api/endpoints/subjects'
import type { Subject } from '@/types'

interface ListFilter {
  page?: number
  limit?: number
  search?: string
  status?: string
}

export const subjectKeys = {
  all: () => ['subjects'] as const,
  list: (filters: ListFilter) => [...subjectKeys.all(), 'list', filters] as const,
  detail: (id: string) => [...subjectKeys.all(), id] as const,
  documents: (id: string) => [...subjectKeys.all(), id, 'documents'] as const,
}

export function useSubjects(filters: ListFilter = {}) {
  return useQuery({
    queryKey: subjectKeys.list(filters),
    queryFn: () => subjectsApi.list(filters),
  })
}

export function useSubject(id: string) {
  return useQuery({
    queryKey: subjectKeys.detail(id),
    queryFn: () => subjectsApi.get(id),
    enabled: !!id,
  })
}

export function useSubjectDocuments(subjectId: string) {
  return useQuery({
    queryKey: subjectKeys.documents(subjectId),
    queryFn: () => subjectsApi.getDocuments(subjectId),
    enabled: !!subjectId,
    refetchInterval: (query) =>
      query.state.data?.some(d => d.status === 'processing') ? 3000 : false,
  })
}

export function useLecturers() {
  return useQuery({
    queryKey: ['users', 'lecturers'],
    queryFn: () => import('@/api/endpoints/users').then(m => m.usersApi.list({ role: 'lecturer', limit: 100 })),
  })
}

export function useCreateSubject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { code: string; name: string; description?: string }) =>
      subjectsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: subjectKeys.all() }),
  })
}

export function useUpdateSubject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Pick<Subject, 'name' | 'description' | 'status'>> }) =>
      subjectsApi.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: subjectKeys.all() })
      qc.invalidateQueries({ queryKey: subjectKeys.detail(id) })
    },
  })
}

export function useDeleteSubject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => subjectsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: subjectKeys.all() }),
  })
}

export function useDocumentSummary(subjectId: string, documentId: string | null) {
  return useQuery({
    queryKey: [...subjectKeys.documents(subjectId), documentId, 'summary'],
    queryFn: () => subjectsApi.getDocumentSummary(subjectId, documentId!),
    enabled: !!subjectId && !!documentId,
    staleTime: Infinity, // summaries are cached server-side; no need to refetch
    retry: false,
  })
}

export function useUploadDocument(subjectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => subjectsApi.uploadDocument(subjectId, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: subjectKeys.documents(subjectId) }),
  })
}

export function useDeleteDocument(subjectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (documentId: string) => subjectsApi.deleteDocument(subjectId, documentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: subjectKeys.documents(subjectId) }),
  })
}

export function useAssignLecturer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ subjectId, lecturerId }: { subjectId: string; lecturerId: string }) =>
      subjectsApi.assignLecturer(subjectId, lecturerId),
    onSuccess: (_, { subjectId }) => qc.invalidateQueries({ queryKey: subjectKeys.detail(subjectId) }),
  })
}

export function useRemoveLecturer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ subjectId, lecturerId }: { subjectId: string; lecturerId: string }) =>
      subjectsApi.removeLecturer(subjectId, lecturerId),
    onSuccess: (_, { subjectId }) => qc.invalidateQueries({ queryKey: subjectKeys.detail(subjectId) }),
  })
}
