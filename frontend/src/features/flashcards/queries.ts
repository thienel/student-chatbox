import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { flashcardsApi } from '@/api/endpoints/flashcards'

export const flashcardKeys = {
  list: (subjectId: string) => ['flashcards', subjectId] as const,
  detail: (subjectId: string, setId: string) => ['flashcards', subjectId, setId] as const,
}

export function useFlashcardSets(subjectId: string) {
  return useQuery({
    queryKey: flashcardKeys.list(subjectId),
    queryFn: () => flashcardsApi.list(subjectId),
    enabled: !!subjectId,
  })
}

export function useFlashcardSet(subjectId: string, setId: string) {
  return useQuery({
    queryKey: flashcardKeys.detail(subjectId, setId),
    queryFn: () => flashcardsApi.get(subjectId, setId),
    enabled: !!subjectId && !!setId,
  })
}

export function useGenerateFlashcards(subjectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { topic?: string; cardCount?: number }) =>
      flashcardsApi.generate(subjectId, data),
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
