export type BoardQuestionStatus = 'open' | 'answered' | 'closed';

export interface BoardQuestion {
  id: string;
  classId: string;
  authorId: string;
  title: string;
  body: string;
  status: BoardQuestionStatus;
  upvoteCount: number;
  answerCount: number;
  createdAt: string;
  updatedAt: string;
  isUpvotedByMe?: boolean;
}

export interface BoardAnswer {
  id: string;
  questionId: string;
  authorId: string;
  body: string;
  isPinned: boolean;
  upvoteCount: number;
  createdAt: string;
  updatedAt: string;
  isUpvotedByMe?: boolean;
}

export interface BoardQuestionList {
  items: BoardQuestion[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateBoardQuestionRequest { title: string; body?: string; content?: string; subjectId?: string; classId?: string; isAnonymous?: boolean; }
export interface CreateBoardAnswerRequest { content?: string | any; isAnonymous?: boolean; }