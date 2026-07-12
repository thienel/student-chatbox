import { Injectable, Inject, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { IExamRepository } from '../../../domain/exam/repositories/exam.repository.interface';
import { IWeakTopicRepository } from '../../../domain/exam/repositories/weak-topic.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { User } from '../../../domain/user/entities/user.entity';
import { SubmitAttemptDto } from '../dtos/exam.dto';

@Injectable()
export class SubmitAttemptUseCase {
  constructor(
    @Inject(TOKENS.EXAM_REPO) private readonly examRepo: IExamRepository,
    @Inject(TOKENS.WEAK_TOPIC_REPO) private readonly weakTopicRepo: IWeakTopicRepository,
  ) {}

  async execute(examId: string, attemptId: string, dto: SubmitAttemptDto, user: User) {
    const attempt = await this.examRepo.findAttemptById(attemptId);
    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.userId !== user.id) throw new ForbiddenException();
    if (attempt.examId !== examId) throw new NotFoundException('Attempt not found');
    if (attempt.status === 'completed') {
      throw new ConflictException('This attempt has already been submitted');
    }

    const questions = await this.examRepo.findQuestionsByExamId(examId);
    this.validateAnswers(dto.answers, questions);
    const now = new Date();
    const timeSpentSecs = Math.max(0, Math.floor((now.getTime() - attempt.startedAt.getTime()) / 1000));

    if (dto.action === 'save_progress') {
      const saved = await this.examRepo.updateInProgressAttempt(attemptId, {
        answers: dto.answers,
        timeSpentSecs,
      });
      if (!saved) throw new ConflictException('This attempt has already been submitted');
      return saved;
    }

    // submit — grade the exam
    const correctCount = questions.filter(
      (q) => dto.answers[q.id] === q.correctAnswer,
    ).length;
    const total = questions.length;
    const score = total > 0 ? parseFloat(((correctCount / total) * 10).toFixed(2)) : 0;

    const result = await this.examRepo.updateInProgressAttempt(attemptId, {
      answers: dto.answers,
      score,
      totalQuestions: total,
      correctCount,
      status: 'completed',
      completedAt: now,
      timeSpentSecs,
    });
    if (!result) throw new ConflictException('This attempt has already been submitted');

    // Refresh the student's weak-topic profile from all completed attempts.
    const exam = await this.examRepo.findExamById(examId);
    if (exam) {
      await this.weakTopicRepo.recompute(user.id, exam.subjectId);
    }

    return result;
  }

  private validateAnswers(
    answers: Record<string, string>,
    questions: Array<{ id: string; options: Array<{ key: string }> }>,
  ): void {
    if (!answers || Array.isArray(answers) || typeof answers !== 'object') {
      throw new BadRequestException('Answers must be an object keyed by question id');
    }
    const entries = Object.entries(answers);
    if (entries.length > questions.length || JSON.stringify(answers).length > 64_000) {
      throw new BadRequestException('Answer payload is too large');
    }
    const questionsById = new Map(questions.map((question) => [question.id, question]));
    for (const [questionId, answer] of entries) {
      const question = questionsById.get(questionId);
      if (!question || typeof answer !== 'string' || !question.options.some((option) => option.key === answer)) {
        throw new BadRequestException('Answers contain an invalid question or option');
      }
    }
  }
}
