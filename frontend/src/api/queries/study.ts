import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { studyApi } from '@/api/endpoints/study'
import { queryKeys } from '@/api/queryKeys'
import type { CardRating } from '@/types'

export function useStudyQueue(setId: string) {
  return useQuery({
    queryKey: queryKeys.study.queue(setId),
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
  return useQuery({ queryKey: queryKeys.study.settings, queryFn: () => studyApi.getSettings() })
}

export function useUpdateStudySettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (newCardsPerDay: number) => studyApi.updateSettings(newCardsPerDay),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.study.settings }),
  })
}

export function useStudyStats() {
  return useQuery({ queryKey: queryKeys.study.stats, queryFn: () => studyApi.getStats() })
}

export function useCurrentStudyPlan() {
  return useQuery({ queryKey: queryKeys.study.currentPlan, queryFn: () => studyApi.getCurrentPlan() })
}

