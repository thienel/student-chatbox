import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { chatsApi } from '@/api/endpoints/chats'

export const chatKeys = {
  all: () => ['chats'] as const,
  list: (subjectId?: string) => [...chatKeys.all(), 'list', subjectId] as const,
  detail: (id: string) => [...chatKeys.all(), id] as const,
}

export function useChats(subjectId?: string) {
  return useQuery({
    queryKey: chatKeys.list(subjectId),
    queryFn: () => chatsApi.list(subjectId ? { subjectId } : undefined),
  })
}

export function useChat(id: string) {
  return useQuery({
    queryKey: chatKeys.detail(id),
    queryFn: () => chatsApi.get(id),
    enabled: !!id,
  })
}

export function useCreateChat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { subjectId: string; classId?: string; title?: string }) =>
      chatsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: chatKeys.all() }),
  })
}

export function useDeleteChat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => chatsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: chatKeys.all() }),
  })
}
