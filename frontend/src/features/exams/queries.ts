import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { examsApi } from '@/api/endpoints/exams'
import type { ExamDifficulty, CreateOfficialExamInput } from '@/types'

export const examKeys = {
  list: (subjectId: string) => ['exams', subjectId] as const,
  detail: (subjectId: string, examId: string) => ['exams', subjectId, examId] as const,
  attempts: () => ['exam-attempts'] as const,
  attempt: (attemptId: string) => ['exam-attempt', attemptId] as const,
}

export function useExams(subjectId: string, classId?: string) {
  return useQuery({
    queryKey: [...examKeys.list(subjectId), classId ?? null],
    queryFn: () => examsApi.list(subjectId, classId),
    enabled: !!subjectId && !!classId,
  })
}

export function useExam(subjectId: string, examId: string) {
  return useQuery({
    queryKey: examKeys.detail(subjectId, examId),
    queryFn: () => examsApi.get(subjectId, examId),
    enabled: !!subjectId && !!examId,
  })
}

export function useGenerateExam(subjectId: string, classId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      questionCount?: number
      difficulty?: ExamDifficulty
      topic?: string
      documentIds?: string[]
    }) => examsApi.generate(subjectId, { ...data, classId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: examKeys.list(subjectId) }),
  })
}

export function useCreateOfficialExam(subjectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateOfficialExamInput) => examsApi.createOfficial(subjectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: examKeys.list(subjectId) }),
  })
}

export function useStartAttempt(subjectId: string) {
  return useMutation({
    mutationFn: (examId: string) => examsApi.startAttempt(subjectId, examId),
  })
}

export function useSubmitAttempt(subjectId: string, examId: string) {
  const qc = useQueryClient()
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
      qc.invalidateQueries({ queryKey: examKeys.attempts() })
    },
  })
}

export function useMyAttempts() {
  return useQuery({
    queryKey: examKeys.attempts(),
    queryFn: () => examsApi.listMyAttempts(),
  })
}

export function useAttemptResult(attemptId: string) {
  return useQuery({
    queryKey: examKeys.attempt(attemptId),
    queryFn: () => examsApi.getAttemptResult(attemptId),
    enabled: !!attemptId,
  })
}
