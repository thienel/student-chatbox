export type ExamDifficulty = 'easy' | 'medium' | 'hard';
export type ExamType = 'official' | 'ai_generated';

export interface QuestionOption {
  key: string;
  text: string;
}

export interface Question {
  id: string;
  examId: string;
  content: string;
  options: QuestionOption[];
  correctAnswer?: string;  // only in results
  explanation?: string;    // only in results
  topic?: string;
  position: number;
}

export interface OfficialQuestionInput {
  content: string;
  options: QuestionOption[];
  correctAnswer: string;
  explanation?: string;
  topic?: string;
}

export interface CreateOfficialExamInput {
  classId: string;
  title: string;
  description?: string;
  durationMinutes?: number;
  questions: OfficialQuestionInput[];
}

export interface Exam {
  id: string;
  subjectId: string;
  title: string;
  description?: string;
  type: ExamType;
  difficulty?: ExamDifficulty;
  durationMinutes: number;
  questionCount: number;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  /** Only returned for lecturers/admins viewing an official exam */
  questions?: Question[];
  /** Only returned for lecturers/admins viewing an official exam */
  attemptCount?: number;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  userId: string;
  answers: Record<string, string>;
  score?: number;
  totalQuestions?: number;
  correctCount?: number;
  status: 'in_progress' | 'completed' | 'abandoned';
  startedAt: string;
  completedAt?: string;
  timeSpentSecs?: number;
  exam?: { id: string; title: string; subjectId: string };
}

export interface GenerateExamRequest { subjectId?: string; classId?: string; durationMinutes?: number; questionCount?: number; totalQuestions?: number; type?: string; difficulty?: string; topic?: string; documentIds?: string[]; }
export interface SubmitAttemptRequest { answers: Record<string, string> | any; action?: string; timeSpentSecs?: number; }
export interface SubmitExamAttemptRequest { answers: { questionId: string; selectedOptionId: string }[] }

/** Question as returned by the AI preview endpoint (before persisting). */
export interface GeneratedQuestion {
  content: string;
  options: QuestionOption[];
  correct_answer: string; // snake_case from AI service
  explanation?: string;
  topic?: string;
}