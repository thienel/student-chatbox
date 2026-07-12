import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { boardApi } from '@/api/endpoints/board'
import { queryKeys } from '@/api/queryKeys'
import type { BoardQuestionStatus } from '@/types'

export const useBoardQuestions = (
  subjectId: string,
  classId: string | undefined,
  opts: { status?: BoardQuestionStatus; sort?: 'upvotes' | 'newest'; page?: number },
) => {
  return useQuery({
    queryKey: queryKeys.board.questions(subjectId, classId ?? '', opts),
    queryFn: () => boardApi.listQuestions(subjectId, classId!, opts),
    enabled: !!subjectId && !!classId,
  })
}

export const useCreateQuestion = (subjectId: string, classId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { title: string; body: string }) => boardApi.createQuestion(subjectId, classId, data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.board.all })
    },
  })
}

export const useDeleteQuestion = (subjectId: string, classId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (questionId: string) => boardApi.deleteQuestion(subjectId, classId, questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.board.all })
    },
  })
}

export const useCloseQuestion = (subjectId: string, classId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (questionId: string) => boardApi.closeQuestion(subjectId, classId, questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.board.all })
    },
  })
}

export const useUpvoteQuestion = (subjectId: string, classId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (questionId: string) => boardApi.upvoteQuestion(subjectId, classId, questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.board.all })
    },
  })
}

export const useBoardAnswers = (subjectId: string, classId: string | undefined, questionId: string) => {
  return useQuery({
    queryKey: queryKeys.board.answers(subjectId, classId ?? '', questionId),
    queryFn: () => boardApi.listAnswers(subjectId, classId!, questionId),
    enabled: !!subjectId && !!classId && !!questionId,
  })
}

export const useCreateAnswer = (subjectId: string, classId: string, questionId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: string) => boardApi.createAnswer(subjectId, classId, questionId, { body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.board.answers(subjectId, classId, questionId) })
    },
  })
}

export const useDeleteAnswer = (subjectId: string, classId: string, questionId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (answerId: string) => boardApi.deleteAnswer(subjectId, classId, questionId, answerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.board.answers(subjectId, classId, questionId) })
    },
  })
}

export const usePinAnswer = (subjectId: string, classId: string, questionId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (answerId: string) => boardApi.pinAnswer(subjectId, classId, questionId, answerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.board.answers(subjectId, classId, questionId) })
    },
  })
}

export const useUpvoteAnswer = (subjectId: string, classId: string, questionId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (answerId: string) => boardApi.upvoteAnswer(subjectId, classId, questionId, answerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.board.answers(subjectId, classId, questionId) })
    },
  })
}
