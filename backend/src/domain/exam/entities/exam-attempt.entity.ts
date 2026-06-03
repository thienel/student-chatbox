export class ExamAttempt {
  id: string;
  examId: string;
  userId: string;
  answers: Record<string, string>;
  score?: number;
  totalQuestions?: number;
  correctCount?: number;
  status: 'in_progress' | 'completed' | 'abandoned';
  startedAt: Date;
  completedAt?: Date;
  timeSpentSecs?: number;
}
