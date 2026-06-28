import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { studyApi } from '@/api/endpoints/study'
import type { CardRating } from '@/types'

export const studyKeys = {
  queue: (setId: string) => ['study-queue', setId] as const,
  settings: () => ['study-settings'] as const,
  stats: () => ['study-stats'] as const,
}

export function useStudyQueue(setId: string) {
  return useQuery({
    queryKey: studyKeys.queue(setId),
    queryFn: () => studyApi.getQueue(setId),
    enabled: !!setId,
  })
}

export function useStartStudySession() {
  return useMutation({ mutationFn: (setId: string) => studyApi.startSession(setId) })
}

export function useReviewCard() {
  return useMutation({
    mutationFn: ({ sessionId, flashcardId, rating }: { sessionId: string; flashcardId: string; rating: CardRating }) =>
      studyApi.review(sessionId, flashcardId, rating),
  })
}

export function useStudySettings() {
  return useQuery({ queryKey: studyKeys.settings(), queryFn: () => studyApi.getSettings() })
}

export function useUpdateStudySettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (newCardsPerDay: number) => studyApi.updateSettings(newCardsPerDay),
    onSuccess: () => qc.invalidateQueries({ queryKey: studyKeys.settings() }),
  })
}

export function useStudyStats() {
  return useQuery({ queryKey: studyKeys.stats(), queryFn: () => studyApi.getStats() })
}
