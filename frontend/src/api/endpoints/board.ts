import axiosInstance from '@/api/axiosInstance'
import type {
  ApiResponse, BoardQuestion, BoardAnswer, BoardQuestionList, BoardQuestionStatus,
} from '@/types'

const base = (subjectId: string, classId: string) =>
  `/subjects/${subjectId}/classes/${classId}/board`

export const boardApi = {
  listQuestions: (
    subjectId: string,
    classId: string,
    params: { status?: BoardQuestionStatus; sort?: 'upvotes' | 'newest'; page?: number },
  ) =>
    axiosInstance
      .get<ApiResponse<BoardQuestionList>>(`${base(subjectId, classId)}/questions`, { params })
      .then(r => r.data.data),

  createQuestion: (subjectId: string, classId: string, data: { title: string; body: string }) =>
    axiosInstance
      .post<ApiResponse<BoardQuestion>>(`${base(subjectId, classId)}/questions`, data)
      .then(r => r.data.data),

  deleteQuestion: (subjectId: string, classId: string, questionId: string) =>
    axiosInstance.delete(`${base(subjectId, classId)}/questions/${questionId}`),

  closeQuestion: (subjectId: string, classId: string, questionId: string) =>
    axiosInstance.patch(`${base(subjectId, classId)}/questions/${questionId}/close`, {}),

  upvoteQuestion: (subjectId: string, classId: string, questionId: string) =>
    axiosInstance
      .post<ApiResponse<{ upvoted: boolean; upvoteCount: number }>>(
        `${base(subjectId, classId)}/questions/${questionId}/upvote`, {},
      )
      .then(r => r.data.data),

  listAnswers: (subjectId: string, classId: string, questionId: string) =>
    axiosInstance
      .get<ApiResponse<BoardAnswer[]>>(`${base(subjectId, classId)}/questions/${questionId}/answers`)
      .then(r => r.data.data),

  createAnswer: (subjectId: string, classId: string, questionId: string, body: string) =>
    axiosInstance
      .post<ApiResponse<BoardAnswer>>(`${base(subjectId, classId)}/questions/${questionId}/answers`, { body })
      .then(r => r.data.data),

  deleteAnswer: (subjectId: string, classId: string, questionId: string, answerId: string) =>
    axiosInstance.delete(`${base(subjectId, classId)}/questions/${questionId}/answers/${answerId}`),

  pinAnswer: (subjectId: string, classId: string, questionId: string, answerId: string) =>
    axiosInstance
      .post<ApiResponse<{ pinned: boolean }>>(
        `${base(subjectId, classId)}/questions/${questionId}/answers/${answerId}/pin`, {},
      )
      .then(r => r.data.data),

  upvoteAnswer: (subjectId: string, classId: string, questionId: string, answerId: string) =>
    axiosInstance
      .post<ApiResponse<{ upvoted: boolean; upvoteCount: number }>>(
        `${base(subjectId, classId)}/questions/${questionId}/answers/${answerId}/upvote`, {},
      )
      .then(r => r.data.data),
}
