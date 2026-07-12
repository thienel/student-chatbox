import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { flashcardsApi } from '@/api/endpoints/flashcards'
import { queryKeys } from '@/api/queryKeys'

export const useFlashcardSets = (subjectId: string, classId?: string) => {
  return useQuery({
    queryKey: queryKeys.flashcards.list(subjectId, classId),
    queryFn: () => flashcardsApi.list(subjectId, classId),
    enabled: !!subjectId && !!classId,
  })
}

export const useFlashcardSet = (subjectId: string, setId: string) => {
  return useQuery({
    queryKey: queryKeys.flashcards.detail(subjectId, setId),
    queryFn: () => flashcardsApi.get(subjectId, setId),
    enabled: !!subjectId && !!setId,
  })
}

export const useGenerateFlashcards = (subjectId: string, classId?: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { topic?: string; cardCount?: number; documentIds?: string[] }) =>
      flashcardsApi.generate(subjectId, { ...data, classId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.flashcards.list(subjectId, classId) })
    },
  })
}

export const useDeleteFlashcardSet = (subjectId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (setId: string) => flashcardsApi.delete(subjectId, setId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.flashcards.list(subjectId) })
    },
  })
}

export const useDiscoverFlashcards = (opts: { subjectId?: string; sort?: 'stars' | 'newest'; page?: number }) => {
  return useQuery({
    queryKey: queryKeys.flashcards.discover(opts),
    queryFn: () => flashcardsApi.discover(opts),
  })
}

export const useFlashcardLeaderboard = (subjectId?: string) => {
  return useQuery({
    queryKey: queryKeys.flashcards.leaderboard(subjectId),
    queryFn: () => flashcardsApi.leaderboard(subjectId),
  })
}

export const useToggleStar = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ setId, starred }: { setId: string; starred: boolean }) =>
      starred ? flashcardsApi.unstar(setId) : flashcardsApi.star(setId),
    onSuccess: () => {
      // Invalidate both discover and leaderboard where this card might appear
      queryClient.invalidateQueries({ queryKey: queryKeys.flashcards.discover({}) })
      queryClient.invalidateQueries({ queryKey: queryKeys.flashcards.leaderboard() })
      // Invalidate list queries so "My Sets" tab updates star count
      queryClient.invalidateQueries({ queryKey: [...queryKeys.flashcards.all, 'list'] })
    },
  })
}

export const useCloneFlashcardSet = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (setId: string) => flashcardsApi.clone(setId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.flashcards.all })
    },
  })
}

export const useSetFlashcardVisibility = (subjectId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ setId, isPublic }: { setId: string; isPublic: boolean }) =>
      flashcardsApi.setVisibility(setId, isPublic),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.flashcards.list(subjectId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.flashcards.discover({}) })
    },
  })
}
