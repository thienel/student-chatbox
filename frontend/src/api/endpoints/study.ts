import axiosInstance from '@/api/axiosInstance'
import type {
  ApiResponse, StudyQueue, StudySessionStart, ReviewResult, StudySettings, StudyStats, CardRating, StudyPlan,
} from '@/types'

export const studyApi = {
  getQueue: (setId: string) =>
    axiosInstance
      .get<ApiResponse<StudyQueue>>(`/flashcard-sets/${setId}/study-queue`)
      .then(r => r.data.data),

  startSession: (setId: string) =>
    axiosInstance
      .post<ApiResponse<StudySessionStart>>(`/flashcard-sets/${setId}/study-sessions`, {})
      .then(r => r.data.data),

  review: (sessionId: string, flashcardId: string, rating: CardRating) =>
    axiosInstance
      .post<ApiResponse<ReviewResult>>(`/study-sessions/${sessionId}/reviews`, { flashcardId, rating })
      .then(r => r.data.data),

  getSettings: () =>
    axiosInstance.get<ApiResponse<StudySettings>>('/study-settings').then(r => r.data.data),

  updateSettings: (newCardsPerDay: number) =>
    axiosInstance
      .patch<ApiResponse<StudySettings>>('/study-settings', { newCardsPerDay })
      .then(r => r.data.data),

  getStats: () =>
    axiosInstance.get<ApiResponse<StudyStats>>('/study-stats').then(r => r.data.data),

  getCurrentPlan: () =>
    axiosInstance.get<ApiResponse<StudyPlan>>('/study-plan/current').then(r => r.data.data),

  getPlanHistory: (limit?: number) =>
    axiosInstance
      .get<ApiResponse<StudyPlan[]>>('/study-plan/history', { params: limit ? { limit } : undefined })
      .then(r => r.data.data),
}
