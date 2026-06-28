import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { flashcardsApi } from '@/api/endpoints/flashcards'

export const flashcardKeys = {
  list: (subjectId: string) => ['flashcards', subjectId] as const,
  detail: (subjectId: string, setId: string) => ['flashcards', subjectId, setId] as const,
  discover: (subjectId?: string, sort?: string) => ['flashcards-discover', subjectId ?? null, sort ?? 'stars'] as const,
  leaderboard: (subjectId?: string) => ['flashcards-leaderboard', subjectId ?? null] as const,
}

export function useFlashcardSets(subjectId: string, classId?: string) {
  return useQuery({
    queryKey: [...flashcardKeys.list(subjectId), classId ?? null],
    queryFn: () => flashcardsApi.list(subjectId, classId),
    enabled: !!subjectId && !!classId,
  })
}

export function useFlashcardSet(subjectId: string, setId: string) {
  return useQuery({
    queryKey: flashcardKeys.detail(subjectId, setId),
    queryFn: () => flashcardsApi.get(subjectId, setId),
    enabled: !!subjectId && !!setId,
  })
}

export function useGenerateFlashcards(subjectId: string, classId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { topic?: string; cardCount?: number; documentIds?: string[] }) =>
      flashcardsApi.generate(subjectId, { ...data, classId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: flashcardKeys.list(subjectId) }),
  })
}

export function useDeleteFlashcardSet(subjectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (setId: string) => flashcardsApi.delete(subjectId, setId),
    onSuccess: () => qc.invalidateQueries({ queryKey: flashcardKeys.list(subjectId) }),
  })
}

export function useDiscoverFlashcards(opts: { subjectId?: string; sort?: 'stars' | 'newest'; page?: number }) {
  return useQuery({
    queryKey: [...flashcardKeys.discover(opts.subjectId, opts.sort), opts.page ?? 1],
    queryFn: () => flashcardsApi.discover(opts),
  })
}

export function useFlashcardLeaderboard(subjectId?: string) {
  return useQuery({
    queryKey: flashcardKeys.leaderboard(subjectId),
    queryFn: () => flashcardsApi.leaderboard(subjectId),
  })
}

export function useToggleStar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ setId, starred }: { setId: string; starred: boolean }) =>
      starred ? flashcardsApi.unstar(setId) : flashcardsApi.star(setId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['flashcards-discover'] })
      qc.invalidateQueries({ queryKey: ['flashcards-leaderboard'] })
    },
  })
}

export function useCloneFlashcardSet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (setId: string) => flashcardsApi.clone(setId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['flashcards'] }),
  })
}

export function useSetFlashcardVisibility(subjectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ setId, isPublic }: { setId: string; isPublic: boolean }) =>
      flashcardsApi.setVisibility(setId, isPublic),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: flashcardKeys.list(subjectId) })
      qc.invalidateQueries({ queryKey: ['flashcards-discover'] })
    },
  })
}
