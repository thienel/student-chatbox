import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IExamRepository } from '../../../domain/exam/repositories/exam.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { User } from '../../../domain/user/entities/user.entity';

@Injectable()
export class GetAttemptResultUseCase {
  constructor(
    @Inject(TOKENS.EXAM_REPO) private readonly examRepo: IExamRepository,
  ) {}

  async execute(attemptId: string, user: User) {
    const attempt = await this.examRepo.findAttemptById(attemptId);
    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.userId !== user.id && user.roleName !== 'admin') throw new ForbiddenException();

    const exam = await this.examRepo.findExamById(attempt.examId);
    if (!exam) throw new NotFoundException('Exam not found');

    // Include correct_answer + explanation after submission
    const questions = await this.examRepo.findQuestionsByExamId(attempt.examId);

    return { attempt, exam, questions };
  }
}
