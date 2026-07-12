import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
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
    private readonly dataSource: DataSource,
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

  async createExamWithQuestions(
    exam: Partial<Exam>, questions: Array<Partial<Question>>,
  ): Promise<{ exam: Exam; questions: Question[] }> {
    return this.dataSource.transaction(async (manager) => {
      const savedExam = await manager.save(ExamOrmEntity, manager.create(ExamOrmEntity, {
        subjectId: exam.subjectId,
        classId: exam.classId,
        title: exam.title,
        description: exam.description ?? null,
        type: exam.type,
        difficulty: exam.difficulty ?? null,
        durationMinutes: exam.durationMinutes ?? 0,
        questionCount: exam.questionCount ?? questions.length,
        isPublic: exam.isPublic ?? false,
        createdBy: exam.createdBy,
      }));
      const savedQuestions = await manager.save(QuestionOrmEntity, manager.create(
        QuestionOrmEntity,
        questions.map((q) => ({
          examId: savedExam.id,
          content: q.content,
          options: q.options as object,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation ?? null,
          topic: q.topic ?? null,
          position: q.position ?? 0,
        })),
      ));
      return { exam: this.toExam(savedExam), questions: savedQuestions.map((q) => this.toQuestion(q)) };
    });
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

  async updateOfficialExamIfUnattempted(
    id: string,
    data: Partial<Exam>,
    replacementQuestions?: Array<Partial<Question>>,
  ): Promise<{ exam: Exam; questions: Question[] } | null> {
    return this.dataSource.transaction(async (manager) => {
      const exam = await manager.findOne(ExamOrmEntity, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!exam) return null;

      // Starting an attempt obtains a shared lock on the same exam, so this
      // check cannot be bypassed by a concurrent attempt creation.
      const attemptCount = await manager.count(ExamAttemptOrmEntity, { where: { examId: id } });
      if (attemptCount > 0) return null;

      if (data.title !== undefined) exam.title = data.title;
      if (data.description !== undefined) exam.description = data.description ?? null;
      if (data.durationMinutes !== undefined) exam.durationMinutes = data.durationMinutes;
      if (data.questionCount !== undefined) exam.questionCount = data.questionCount;
      const savedExam = await manager.save(ExamOrmEntity, exam);

      let savedQuestions: QuestionOrmEntity[];
      if (replacementQuestions) {
        await manager.delete(QuestionOrmEntity, { examId: id });
        savedQuestions = await manager.save(QuestionOrmEntity, manager.create(
          QuestionOrmEntity,
          replacementQuestions.map((q) => ({
            examId: id,
            content: q.content,
            options: q.options as object,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation ?? null,
            topic: q.topic ?? null,
            position: q.position ?? 0,
          })),
        ));
      } else {
        savedQuestions = await manager.find(QuestionOrmEntity, {
          where: { examId: id }, order: { position: 'ASC' },
        });
      }

      return { exam: this.toExam(savedExam), questions: savedQuestions.map((q) => this.toQuestion(q)) };
    });
  }

  async createAttempt(data: Partial<ExamAttempt>): Promise<ExamAttempt> {
    return this.dataSource.transaction(async (manager) => {
      // Coordinates with official-exam editing's exclusive lock.
      await manager.findOneOrFail(ExamOrmEntity, {
        where: { id: data.examId }, lock: { mode: 'pessimistic_read' },
      });
      const saved = await manager.save(ExamAttemptOrmEntity, manager.create(ExamAttemptOrmEntity, {
        examId: data.examId,
        userId: data.userId,
        answers: data.answers ?? {},
        status: data.status ?? 'in_progress',
      }));
      return this.toAttempt(saved);
    });
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
    const updateData: Partial<ExamAttemptOrmEntity> = {};
    if (data.answers !== undefined) updateData.answers = data.answers as object;
    if (data.score !== undefined) updateData.score = data.score;
    if (data.totalQuestions !== undefined) updateData.totalQuestions = data.totalQuestions;
    if (data.correctCount !== undefined) updateData.correctCount = data.correctCount;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.completedAt !== undefined) updateData.completedAt = data.completedAt;
    if (data.timeSpentSecs !== undefined) updateData.timeSpentSecs = data.timeSpentSecs;
    await this.attemptRepo.update(id, updateData);
    const updated = await this.attemptRepo.findOneOrFail({ where: { id } });
    return this.toAttempt(updated);
  }

  async updateInProgressAttempt(id: string, data: Partial<ExamAttempt>): Promise<ExamAttempt | null> {
    const updateData: Partial<ExamAttemptOrmEntity> = {};
    if (data.answers !== undefined) updateData.answers = data.answers as object;
    if (data.score !== undefined) updateData.score = data.score;
    if (data.totalQuestions !== undefined) updateData.totalQuestions = data.totalQuestions;
    if (data.correctCount !== undefined) updateData.correctCount = data.correctCount;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.completedAt !== undefined) updateData.completedAt = data.completedAt;
    if (data.timeSpentSecs !== undefined) updateData.timeSpentSecs = data.timeSpentSecs;
    const result = await this.attemptRepo.update({ id, status: 'in_progress' }, updateData);
    if (result.affected !== 1) return null;
    const updated = await this.attemptRepo.findOneOrFail({ where: { id } });
    return this.toAttempt(updated);
  }
}
