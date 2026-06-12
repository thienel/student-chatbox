import axiosInstance from '@/api/axiosInstance'
import type { ApiResponse, Exam, ExamDifficulty, ExamAttempt, Question } from '@/types'

export const examsApi = {
  list: (subjectId: string) =>
    axiosInstance
      .get<ApiResponse<Exam[]>>(`/subjects/${subjectId}/exams`)
      .then(r => r.data.data),

  get: (subjectId: string, examId: string) =>
    axiosInstance
      .get<ApiResponse<Exam>>(`/subjects/${subjectId}/exams/${examId}`)
      .then(r => r.data.data),

  generate: (
    subjectId: string,
    data: { questionCount?: number; difficulty?: ExamDifficulty; topic?: string },
  ) =>
    axiosInstance
      // AI generation runs an LLM call — override the short global timeout.
      .post<ApiResponse<Exam>>(`/subjects/${subjectId}/exams/generate`, data, { timeout: 120000 })
      .then(r => r.data.data),

  startAttempt: (subjectId: string, examId: string) =>
    axiosInstance
      .post<ApiResponse<{ attempt: ExamAttempt; exam: Exam; questions: Question[] }>>(
        `/subjects/${subjectId}/exams/${examId}/attempts`,
        {},
      )
      .then(r => r.data.data),

  submitAttempt: (
    subjectId: string,
    examId: string,
    attemptId: string,
    data: {
      answers: Record<string, string>
      action: 'save_progress' | 'submit'
      timeSpentSecs?: number
    },
  ) =>
    axiosInstance
      .post<ApiResponse<ExamAttempt>>(
        `/subjects/${subjectId}/exams/${examId}/attempts/${attemptId}`,
        data,
      )
      .then(r => r.data.data),

  listMyAttempts: () =>
    axiosInstance.get<ApiResponse<ExamAttempt[]>>('/exam-attempts').then(r => r.data.data),

  getAttemptResult: (attemptId: string) =>
    axiosInstance
      .get<ApiResponse<{ attempt: ExamAttempt; exam: Exam; questions: Question[] }>>(
        `/exam-attempts/${attemptId}`,
      )
      .then(r => r.data.data),
}
