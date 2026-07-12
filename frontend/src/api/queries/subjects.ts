import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { subjectsApi } from '@/api/endpoints/subjects'
import { queryKeys } from '@/api/queryKeys'
import type { CreateSubjectRequest, UpdateSubjectRequest } from '@/types'

export const useSubjects = (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
  return useQuery({
    queryKey: queryKeys.subjects.list(params),
    queryFn: () => subjectsApi.list(params),
    placeholderData: (prev) => prev,
  })
}

export const useSubject = (id: string) => {
  return useQuery({
    queryKey: queryKeys.subjects.detail(id),
    queryFn: () => subjectsApi.get(id),
    enabled: !!id,
  })
}

export const useCreateSubject = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateSubjectRequest) => subjectsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects.all })
    },
  })
}

export const useUpdateSubject = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSubjectRequest }) => subjectsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects.all })
    },
  })
}

export const useDeleteSubject = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => subjectsApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.subjects.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects.all })
    },
  })
}

export const useAssignLecturer = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ subjectId, lecturerId }: { subjectId: string; lecturerId: string }) => subjectsApi.assignLecturer(subjectId, lecturerId),
    onSuccess: (_, { subjectId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects.detail(subjectId) })
    },
  })
}

export const useRemoveLecturer = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ subjectId, lecturerId }: { subjectId: string; lecturerId: string }) => subjectsApi.removeLecturer(subjectId, lecturerId),
    onSuccess: (_, { subjectId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects.detail(subjectId) })
    },
  })
}

export const useSubjectDocuments = (subjectId: string) => {
  return useQuery({
    queryKey: queryKeys.subjects.documents(subjectId),
    queryFn: () => subjectsApi.getDocuments(subjectId),
    enabled: !!subjectId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (Array.isArray(data) && data.some((d: any) => d.status === 'processing')) {
        return 3000;
      }
      return false;
    }
  })
}

export const useUploadDocument = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ subjectId, file }: { subjectId: string; file: File }) => subjectsApi.uploadDocument(subjectId, file),
    onSuccess: (_, { subjectId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects.documents(subjectId) })
    },
  })
}

export const useDeleteDocument = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ subjectId, documentId }: { subjectId: string; documentId: string }) => subjectsApi.deleteDocument(subjectId, documentId),
    onSuccess: (_, { subjectId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects.documents(subjectId) })
    },
  })
}

export const useDocumentSummary = (subjectId: string, documentId: string) => {
  return useQuery({
    queryKey: queryKeys.subjects.documentSummary(subjectId, documentId),
    queryFn: () => subjectsApi.getDocumentSummary(subjectId, documentId),
    enabled: !!subjectId && !!documentId,
    staleTime: Infinity, // summary won't change
  })
}
