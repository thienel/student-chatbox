import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IExamRepository } from '../../../domain/exam/repositories/exam.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { User } from '../../../domain/user/entities/user.entity';
import { SubmitAttemptDto } from '../dtos/exam.dto';

@Injectable()
export class SubmitAttemptUseCase {
  constructor(
    @Inject(TOKENS.EXAM_REPO) private readonly examRepo: IExamRepository,
  ) {}

  async execute(examId: string, attemptId: string, dto: SubmitAttemptDto, user: User) {
    const attempt = await this.examRepo.findAttemptById(attemptId);
    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.userId !== user.id) throw new ForbiddenException();
    if (attempt.examId !== examId) throw new NotFoundException('Attempt not found');

    if (dto.action === 'save_progress') {
      return this.examRepo.updateAttempt(attemptId, {
        answers: dto.answers,
        timeSpentSecs: dto.timeSpentSecs,
      });
    }

    // submit — grade the exam
    const questions = await this.examRepo.findQuestionsByExamId(examId);
    const correctCount = questions.filter(
      (q) => dto.answers[q.id] === q.correctAnswer,
    ).length;
    const total = questions.length;
    const score = total > 0 ? parseFloat(((correctCount / total) * 10).toFixed(2)) : 0;

    return this.examRepo.updateAttempt(attemptId, {
      answers: dto.answers,
      score,
      totalQuestions: total,
      correctCount,
      status: 'completed',
      completedAt: new Date(),
      timeSpentSecs: dto.timeSpentSecs,
    });
  }
}
