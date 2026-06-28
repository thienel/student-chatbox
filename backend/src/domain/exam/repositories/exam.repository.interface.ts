import { Exam } from '../entities/exam.entity';
import { Question } from '../entities/question.entity';
import { ExamAttempt } from '../entities/exam-attempt.entity';

export interface IExamRepository {
  createExam(data: Partial<Exam>): Promise<Exam>;
  updateExam(id: string, data: Partial<Exam>): Promise<Exam>;
  findExamById(id: string): Promise<Exam | null>;
  findExamsBySubjectId(subjectId: string): Promise<Exam[]>;
  findExamsByClassId(classId: string): Promise<Exam[]>;

  createQuestions(questions: Array<Partial<Question>>): Promise<Question[]>;
  findQuestionsByExamId(examId: string): Promise<Question[]>;
  deleteQuestionsByExamId(examId: string): Promise<void>;
  countAttemptsByExamId(examId: string): Promise<number>;

  createAttempt(data: Partial<ExamAttempt>): Promise<ExamAttempt>;
  findAttemptById(id: string): Promise<ExamAttempt | null>;
  findAttemptsByUserId(userId: string): Promise<ExamAttempt[]>;
  updateAttempt(id: string, data: Partial<ExamAttempt>): Promise<ExamAttempt>;
}
