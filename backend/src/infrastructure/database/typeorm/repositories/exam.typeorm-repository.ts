import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IExamRepository } from '../../../../domain/exam/repositories/exam.repository.interface';
import { Exam } from '../../../../domain/exam/entities/exam.entity';
import { Question } from '../../../../domain/exam/entities/question.entity';
import { ExamAttempt } from '../../../../domain/exam/entities/exam-attempt.entity';
import { ExamOrmEntity } from '../orm-entities/exam.orm-entity';
import { QuestionOrmEntity } from '../orm-entities/question.orm-entity';
import { ExamAttemptOrmEntity } from '../orm-entities/exam-attempt.orm-entity';

@Injectable()
export class ExamTypeOrmRepository implements IExamRepository {
  constructor(
    @InjectRepository(ExamOrmEntity)
    private readonly examRepo: Repository<ExamOrmEntity>,
    @InjectRepository(QuestionOrmEntity)
    private readonly questionRepo: Repository<QuestionOrmEntity>,
    @InjectRepository(ExamAttemptOrmEntity)
    private readonly attemptRepo: Repository<ExamAttemptOrmEntity>,
  ) {}

  private toExam(o: ExamOrmEntity): Exam {
    const e = new Exam();
    e.id = o.id; e.subjectId = o.subjectId; e.classId = o.classId; e.title = o.title;
    e.description = o.description ?? undefined;
    e.type = o.type as Exam['type'];
    e.difficulty = (o.difficulty ?? undefined) as Exam['difficulty'];
    e.durationMinutes = o.durationMinutes; e.questionCount = o.questionCount;
    e.isPublic = o.isPublic; e.createdBy = o.createdBy;
    e.createdAt = o.createdAt; e.updatedAt = o.updatedAt;
    return e;
  }

  private toQuestion(o: QuestionOrmEntity): Question {
    const q = new Question();
    q.id = o.id; q.examId = o.examId; q.content = o.content;
    q.options = o.options as Question['options'];
    q.correctAnswer = o.correctAnswer;
    q.explanation = o.explanation ?? undefined;
    q.topic = o.topic ?? undefined;
    q.position = o.position;
    return q;
  }

  private toAttempt(o: ExamAttemptOrmEntity): ExamAttempt {
    const a = new ExamAttempt();
    a.id = o.id; a.examId = o.examId; a.userId = o.userId;
    a.answers = (o.answers ?? {}) as Record<string, string>;
    a.score = o.score ?? undefined;
    a.totalQuestions = o.totalQuestions ?? undefined;
    a.correctCount = o.correctCount ?? undefined;
    a.status = o.status as ExamAttempt['status'];
    a.startedAt = o.startedAt;
    a.completedAt = o.completedAt ?? undefined;
    a.timeSpentSecs = o.timeSpentSecs ?? undefined;
    return a;
  }

  async createExam(data: Partial<Exam>): Promise<Exam> {
    const saved = await this.examRepo.save(this.examRepo.create({
      subjectId: data.subjectId, classId: data.classId, title: data.title,
      description: data.description ?? null, type: data.type,
      difficulty: data.difficulty ?? null, durationMinutes: data.durationMinutes ?? 0,
      questionCount: data.questionCount ?? 10, isPublic: data.isPublic ?? false,
      createdBy: data.createdBy,
    }));
    return this.toExam(saved);
  }

  async updateExam(id: string, data: Partial<Exam>): Promise<Exam> {
    const updateData: Partial<ExamOrmEntity> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description ?? null;
    if (data.durationMinutes !== undefined) updateData.durationMinutes = data.durationMinutes;
    if (data.questionCount !== undefined) updateData.questionCount = data.questionCount;
    await this.examRepo.update(id, updateData);
    const updated = await this.examRepo.findOneOrFail({ where: { id } });
    return this.toExam(updated);
  }

  async findExamById(id: string): Promise<Exam | null> {
    const o = await this.examRepo.findOne({ where: { id } });
    return o ? this.toExam(o) : null;
  }

  async findExamsByClassId(classId: string): Promise<Exam[]> {
    const orms = await this.examRepo.find({ where: { classId }, order: { createdAt: 'DESC' } });
    return orms.map((o) => this.toExam(o));
  }

  async findExamsBySubjectId(subjectId: string): Promise<Exam[]> {
    const orms = await this.examRepo.find({ where: { subjectId }, order: { createdAt: 'DESC' } });
    return orms.map((o) => this.toExam(o));
  }

  async createQuestions(questions: Array<Partial<Question>>): Promise<Question[]> {
    const orms = this.questionRepo.create(
      questions.map((q) => ({
        examId: q.examId, content: q.content, options: q.options as object,
        correctAnswer: q.correctAnswer, explanation: q.explanation ?? null,
        topic: q.topic ?? null, position: q.position ?? 0,
      })),
    );
    const saved = await this.questionRepo.save(orms);
    return saved.map((o) => this.toQuestion(o));
  }

  async findQuestionsByExamId(examId: string): Promise<Question[]> {
    const orms = await this.questionRepo.find({ where: { examId }, order: { position: 'ASC' } });
    return orms.map((o) => this.toQuestion(o));
  }

  async deleteQuestionsByExamId(examId: string): Promise<void> {
    await this.questionRepo.delete({ examId });
  }

  async countAttemptsByExamId(examId: string): Promise<number> {
    return this.attemptRepo.count({ where: { examId } });
  }

  async createAttempt(data: Partial<ExamAttempt>): Promise<ExamAttempt> {
    const saved = await this.attemptRepo.save(this.attemptRepo.create({
      examId: data.examId, userId: data.userId,
      answers: data.answers ?? {}, status: data.status ?? 'in_progress',
    }));
    return this.toAttempt(saved);
  }

  async findAttemptById(id: string): Promise<ExamAttempt | null> {
    const o = await this.attemptRepo.findOne({ where: { id } });
    return o ? this.toAttempt(o) : null;
  }

  async findAttemptsByUserId(userId: string): Promise<ExamAttempt[]> {
    const orms = await this.attemptRepo.find({
      where: { userId },
      order: { startedAt: 'DESC' },
      relations: ['exam'],
    });
    return orms.map((o) => {
      const a = this.toAttempt(o);
      if (o.exam) a.exam = { id: o.exam.id, title: o.exam.title, subjectId: o.exam.subjectId };
      return a;
    });
  }

  async updateAttempt(id: string, data: Partial<ExamAttempt>): Promise<ExamAttempt> {
    await this.attemptRepo.update(id, {
      answers: data.answers as object,
      score: data.score ?? undefined,
      totalQuestions: data.totalQuestions,
      correctCount: data.correctCount,
      status: data.status,
      completedAt: data.completedAt ?? undefined,
      timeSpentSecs: data.timeSpentSecs,
    });
    const updated = await this.attemptRepo.findOneOrFail({ where: { id } });
    return this.toAttempt(updated);
  }
}
