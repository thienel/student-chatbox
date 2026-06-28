import axiosInstance from '@/api/axiosInstance'
import type {
  ApiResponse, FlashcardSet, FlashcardSetWithCards, DiscoverSetsResult, LeaderboardResult, Flashcard,
} from '@/types'

export const flashcardsApi = {
  list: (subjectId: string, classId?: string) =>
    axiosInstance
      .get<ApiResponse<FlashcardSet[]>>(`/subjects/${subjectId}/flashcard-sets`, {
        params: classId ? { classId } : undefined,
      })
      .then(r => r.data.data),

  get: (subjectId: string, setId: string) =>
    axiosInstance
      .get<ApiResponse<{ set: FlashcardSetWithCards; cards: FlashcardSetWithCards['cards'] }>>(
        `/subjects/${subjectId}/flashcard-sets/${setId}`,
      )
      .then(r => r.data.data),

  generate: (
    subjectId: string,
    data: { topic?: string; cardCount?: number; classId?: string; documentIds?: string[] },
  ) =>
    axiosInstance
      // AI generation runs an LLM call — override the short global timeout.
      .post<ApiResponse<{ set: FlashcardSet; cards: FlashcardSetWithCards['cards'] }>>(
        `/subjects/${subjectId}/flashcard-sets/generate`,
        data,
        { timeout: 120000 },
      )
      .then(r => r.data.data),

  delete: (subjectId: string, setId: string) =>
    axiosInstance.delete(`/subjects/${subjectId}/flashcard-sets/${setId}`),

  // Community (top-level /flashcard-sets)
  discover: (params: { subjectId?: string; sort?: 'stars' | 'newest'; page?: number }) =>
    axiosInstance
      .get<ApiResponse<DiscoverSetsResult>>('/flashcard-sets/discover', { params })
      .then(r => r.data.data),

  leaderboard: (subjectId?: string) =>
    axiosInstance
      .get<ApiResponse<LeaderboardResult>>('/flashcard-sets/leaderboard', {
        params: subjectId ? { subjectId } : undefined,
      })
      .then(r => r.data.data),

  star: (setId: string) =>
    axiosInstance
      .post<ApiResponse<{ starCount: number }>>(`/flashcard-sets/${setId}/stars`, {})
      .then(r => r.data.data),

  unstar: (setId: string) =>
    axiosInstance
      .delete<ApiResponse<{ starCount: number }>>(`/flashcard-sets/${setId}/stars`)
      .then(r => r.data.data),

  clone: (setId: string) =>
    axiosInstance
      .post<ApiResponse<{ set: FlashcardSet; cards: Flashcard[] }>>(`/flashcard-sets/${setId}/clone`, {})
      .then(r => r.data.data),

  setVisibility: (setId: string, isPublic: boolean) =>
    axiosInstance
      .patch<ApiResponse<FlashcardSet>>(`/flashcard-sets/${setId}/visibility`, { isPublic })
      .then(r => r.data.data),
}
