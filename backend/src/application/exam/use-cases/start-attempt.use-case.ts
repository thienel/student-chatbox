import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IExamRepository } from '../../../domain/exam/repositories/exam.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { User } from '../../../domain/user/entities/user.entity';
import { ClassContextService } from '../../class/services/class-context.service';

@Injectable()
export class StartAttemptUseCase {
  constructor(
    @Inject(TOKENS.EXAM_REPO) private readonly examRepo: IExamRepository,
    private readonly classContext: ClassContextService,
  ) {}

  async execute(subjectId: string, examId: string, user: User) {
    const exam = await this.examRepo.findExamById(examId);
    if (!exam) throw new NotFoundException('Exam not found');
    await this.classContext.assertAccess(subjectId, user, exam.classId);

    const attempt = await this.examRepo.createAttempt({
      examId, userId: user.id, answers: {}, status: 'in_progress',
    });

    // Return questions without correct_answer
    const questions = await this.examRepo.findQuestionsByExamId(examId);
    const safeQuestions = questions.map(({ correctAnswer: _, explanation: __, ...rest }) => rest);

    return { attempt, exam, questions: safeQuestions };
  }
}
