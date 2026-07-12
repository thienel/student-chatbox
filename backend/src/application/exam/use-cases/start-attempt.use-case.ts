import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
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
    if (!exam || exam.subjectId !== subjectId) throw new NotFoundException('Exam not found');
    await this.classContext.assertAccess(exam.subjectId, user, exam.classId);
    // Official exams are visible to everyone in the class.
    // AI generated exams are private to their creator.
    if (exam.type !== 'official' && exam.createdBy !== user.id) {
      throw new ForbiddenException('You do not have access to this exam');
    }

    const attempt = await this.examRepo.createAttempt({
      examId, userId: user.id, answers: {}, status: 'in_progress',
    });

    // Return questions without correct_answer
    const questions = await this.examRepo.findQuestionsByExamId(examId);
    const safeQuestions = questions.map(({ correctAnswer: _, explanation: __, ...rest }) => rest);

    return { attempt, exam, questions: safeQuestions };
  }
}
