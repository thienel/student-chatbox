import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { examsApi } from '@/api/endpoints/exams'
import { queryKeys } from '@/api/queryKeys'
import type { CreateOfficialExamInput, ExamDifficulty } from '@/types'

export const useExams = (subjectId: string, classId?: string) => {
  return useQuery({
    queryKey: queryKeys.exams.list(subjectId, classId),
    queryFn: () => examsApi.list(subjectId, classId),
    enabled: !!subjectId && !!classId,
  })
}

export const useExam = (subjectId: string, examId: string) => {
  return useQuery({
    queryKey: queryKeys.exams.detail(subjectId, examId),
    queryFn: () => examsApi.get(subjectId, examId),
    enabled: !!subjectId && !!examId,
  })
}

export const useGenerateExam = (subjectId: string, classId?: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      questionCount?: number
      difficulty?: ExamDifficulty
      topic?: string
      documentIds?: string[]
    }) => examsApi.generate(subjectId, { ...data, classId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exams.list(subjectId, classId) })
    },
  })
}

/** Lecturer-only: generates AI questions as a draft without saving an exam. */
export const useGenerateExamPreview = (subjectId: string) => {
  return useMutation({
    mutationFn: (data: {
      questionCount?: number
      difficulty?: ExamDifficulty
      topic?: string
      documentIds?: string[]
      classId?: string
    }) => examsApi.generatePreview(subjectId, data),
  })
}

export const useCreateOfficialExam = (subjectId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateOfficialExamInput) => examsApi.createOfficial(subjectId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exams.list(subjectId, variables.classId) })
    },
  })
}

export const useUpdateOfficialExam = (subjectId: string, examId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Omit<CreateOfficialExamInput, 'classId'>>) =>
      examsApi.updateOfficial(subjectId, examId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exams.detail(subjectId, examId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.exams.all })
    },
  })
}

export const useStartAttempt = (subjectId: string) => {
  return useMutation({
    mutationFn: (examId: string) => examsApi.startAttempt(subjectId, examId),
  })
}

export const useSubmitAttempt = (subjectId: string, examId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      attemptId,
      answers,
      timeSpentSecs,
    }: {
      attemptId: string
      answers: Record<string, string>
      timeSpentSecs?: number
    }) =>
      examsApi.submitAttempt(subjectId, examId, attemptId, {
        answers,
        action: 'submit',
        timeSpentSecs,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exams.myAttempts })
    },
  })
}

export const useMyWeakTopics = (subjectId: string) => {
  return useQuery({
    queryKey: queryKeys.exams.myWeakTopics(subjectId),
    queryFn: () => examsApi.getMyWeakTopics(subjectId),
    enabled: !!subjectId,
  })
}

export const useMyAttempts = () => {
  return useQuery({
    queryKey: queryKeys.exams.myAttempts,
    queryFn: () => examsApi.listMyAttempts(),
  })
}

export const useAttemptResult = (attemptId: string) => {
  return useQuery({
    queryKey: queryKeys.exams.attemptResult(attemptId),
    queryFn: () => examsApi.getAttemptResult(attemptId),
    enabled: !!attemptId,
  })
}
