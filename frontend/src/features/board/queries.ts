import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { boardApi } from '@/api/endpoints/board'
import type { BoardQuestionStatus } from '@/types'

export const boardKeys = {
  questions: (classId: string) => ['board-questions', classId] as const,
  answers: (questionId: string) => ['board-answers', questionId] as const,
}

export function useBoardQuestions(
  subjectId: string,
  classId: string | undefined,
  opts: { status?: BoardQuestionStatus; sort?: 'upvotes' | 'newest'; page?: number },
) {
  return useQuery({
    queryKey: [...boardKeys.questions(classId ?? ''), opts.status ?? 'all', opts.sort ?? 'upvotes', opts.page ?? 1],
    queryFn: () => boardApi.listQuestions(subjectId, classId!, opts),
    enabled: !!subjectId && !!classId,
  })
}

export function useCreateQuestion(subjectId: string, classId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { title: string; body: string }) => boardApi.createQuestion(subjectId, classId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: boardKeys.questions(classId) }),
  })
}

export function useDeleteQuestion(subjectId: string, classId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (questionId: string) => boardApi.deleteQuestion(subjectId, classId, questionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: boardKeys.questions(classId) }),
  })
}

export function useCloseQuestion(subjectId: string, classId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (questionId: string) => boardApi.closeQuestion(subjectId, classId, questionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: boardKeys.questions(classId) }),
  })
}

export function useUpvoteQuestion(subjectId: string, classId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (questionId: string) => boardApi.upvoteQuestion(subjectId, classId, questionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: boardKeys.questions(classId) }),
  })
}

export function useBoardAnswers(subjectId: string, classId: string | undefined, questionId: string) {
  return useQuery({
    queryKey: boardKeys.answers(questionId),
    queryFn: () => boardApi.listAnswers(subjectId, classId!, questionId),
    enabled: !!subjectId && !!classId && !!questionId,
  })
}

export function useCreateAnswer(subjectId: string, classId: string, questionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: string) => boardApi.createAnswer(subjectId, classId, questionId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: boardKeys.answers(questionId) }),
  })
}

export function useDeleteAnswer(subjectId: string, classId: string, questionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (answerId: string) => boardApi.deleteAnswer(subjectId, classId, questionId, answerId),
    onSuccess: () => qc.invalidateQueries({ queryKey: boardKeys.answers(questionId) }),
  })
}

export function usePinAnswer(subjectId: string, classId: string, questionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (answerId: string) => boardApi.pinAnswer(subjectId, classId, questionId, answerId),
    onSuccess: () => qc.invalidateQueries({ queryKey: boardKeys.answers(questionId) }),
  })
}

export function useUpvoteAnswer(subjectId: string, classId: string, questionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (answerId: string) => boardApi.upvoteAnswer(subjectId, classId, questionId, answerId),
    onSuccess: () => qc.invalidateQueries({ queryKey: boardKeys.answers(questionId) }),
  })
}
