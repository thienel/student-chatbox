import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IExamRepository } from '../../../domain/exam/repositories/exam.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { User } from '../../../domain/user/entities/user.entity';

@Injectable()
export class StartAttemptUseCase {
  constructor(
    @Inject(TOKENS.EXAM_REPO) private readonly examRepo: IExamRepository,
  ) {}

  async execute(examId: string, user: User) {
    const exam = await this.examRepo.findExamById(examId);
    if (!exam) throw new NotFoundException('Exam not found');

    const attempt = await this.examRepo.createAttempt({
      examId, userId: user.id, answers: {}, status: 'in_progress',
    });

    // Return questions without correct_answer
    const questions = await this.examRepo.findQuestionsByExamId(examId);
    const safeQuestions = questions.map(({ correctAnswer: _, explanation: __, ...rest }) => rest);

    return { attempt, exam, questions: safeQuestions };
  }
}
