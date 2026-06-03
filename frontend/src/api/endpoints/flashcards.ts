import axiosInstance from '@/api/axiosInstance'
import type { ApiResponse, FlashcardSet, FlashcardSetWithCards } from '@/types'

export const flashcardsApi = {
  list: (subjectId: string) =>
    axiosInstance
      .get<ApiResponse<FlashcardSet[]>>(`/subjects/${subjectId}/flashcard-sets`)
      .then(r => r.data.data),

  get: (subjectId: string, setId: string) =>
    axiosInstance
      .get<ApiResponse<{ set: FlashcardSetWithCards; cards: FlashcardSetWithCards['cards'] }>>(
        `/subjects/${subjectId}/flashcard-sets/${setId}`,
      )
      .then(r => r.data.data),

  generate: (subjectId: string, data: { topic?: string; cardCount?: number }) =>
    axiosInstance
      .post<ApiResponse<{ set: FlashcardSet; cards: FlashcardSetWithCards['cards'] }>>(
        `/subjects/${subjectId}/flashcard-sets/generate`,
        data,
      )
      .then(r => r.data.data),

  delete: (subjectId: string, setId: string) =>
    axiosInstance.delete(`/subjects/${subjectId}/flashcard-sets/${setId}`),
}
