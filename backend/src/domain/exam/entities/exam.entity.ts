export class Exam {
  id: string;
  subjectId: string;
  title: string;
  description?: string;
  type: 'official' | 'ai_generated';
  difficulty?: 'easy' | 'medium' | 'hard';
  durationMinutes: number;
  questionCount: number;
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
