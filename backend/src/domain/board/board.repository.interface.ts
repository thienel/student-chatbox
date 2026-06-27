export type BoardQuestionStatus = 'open' | 'answered' | 'closed';
export type UpvoteTarget = 'question' | 'answer';

export interface BoardQuestion {
  id: string;
  classId: string;
  authorId: string;
  title: string;
  body: string;
  status: BoardQuestionStatus;
  upvoteCount: number;
  answerCount: number;
  createdAt: Date;
  updatedAt: Date;
  isUpvotedByMe?: boolean;
}

export interface BoardAnswer {
  id: string;
  questionId: string;
  authorId: string;
  body: string;
  isPinned: boolean;
  upvoteCount: number;
  createdAt: Date;
  updatedAt: Date;
  isUpvotedByMe?: boolean;
}

export interface QuestionListQuery {
  classId: string;
  userId: string;
  status?: BoardQuestionStatus;
  sort: 'upvotes' | 'newest';
  page: number;
  pageSize: number;
}

export interface QuestionListResult {
  items: BoardQuestion[];
  total: number;
  page: number;
  pageSize: number;
}

export interface IBoardRepository {
  createQuestion(classId: string, authorId: string, title: string, body: string): Promise<BoardQuestion>;
  findQuestionById(id: string): Promise<BoardQuestion | null>;
  listQuestions(query: QuestionListQuery): Promise<QuestionListResult>;
  updateQuestion(id: string, data: { title?: string; body?: string }): Promise<BoardQuestion>;
  deleteQuestion(id: string): Promise<void>;
  setQuestionStatus(id: string, status: BoardQuestionStatus): Promise<void>;

  createAnswer(questionId: string, authorId: string, body: string): Promise<BoardAnswer>;
  findAnswerById(id: string): Promise<BoardAnswer | null>;
  listAnswers(questionId: string, userId: string): Promise<BoardAnswer[]>;
  updateAnswer(id: string, body: string): Promise<BoardAnswer>;
  deleteAnswer(id: string): Promise<void>;

  /** Pin an answer (unpinning any other) and mark the question answered; calling
   * again on the pinned answer unpins it and reopens the question. */
  togglePin(questionId: string, answerId: string): Promise<{ pinned: boolean }>;

  toggleUpvote(
    userId: string, target: UpvoteTarget, targetId: string,
  ): Promise<{ upvoted: boolean; upvoteCount: number }>;
}
