export interface QuestionOption {
  key: string;
  text: string;
}

export class Question {
  id: string;
  examId: string;
  content: string;
  options: QuestionOption[];
  correctAnswer: string;
  explanation?: string;
  position: number;
}
