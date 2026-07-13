import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { chatsApi } from '@/api/endpoints/chats'
import { queryKeys } from '@/api/queryKeys'

export const useChats = (subjectId?: string, opts?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.chats.list(subjectId ? { subjectId } : undefined),
    queryFn: () => chatsApi.list(subjectId ? { subjectId } : undefined),
    enabled: opts?.enabled ?? true,
  })
}

export const useChat = (id: string) => {
  return useQuery({
    queryKey: queryKeys.chats.detail(id),
    queryFn: () => chatsApi.get(id),
    enabled: !!id,
  })
}

export const useCreateChat = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { subjectId: string; classId?: string; title?: string }) =>
      chatsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.all })
    },
  })
}

export const useDeleteChat = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => chatsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.all })
    },
  })
}
