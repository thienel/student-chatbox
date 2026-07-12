import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IExamRepository } from '../../../domain/exam/repositories/exam.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { User } from '../../../domain/user/entities/user.entity';
import { ClassContextService } from '../../class/services/class-context.service';

@Injectable()
export class GetExamUseCase {
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

    // For lecturers and admins viewing an exam, attach the full
    // question list (including correct answers) and the attempt count so
    // the UI can render the question-review panel and lock editing.
    const isPrivileged = user.roleName === 'lecturer' || user.roleName === 'admin';
    if (isPrivileged) {
      const [questions, attemptCount] = await Promise.all([
        this.examRepo.findQuestionsByExamId(examId),
        this.examRepo.countAttemptsByExamId(examId),
      ]);
      return { ...exam, questions, attemptCount };
    }

    return exam;
  }
}
