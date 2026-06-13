import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IExamRepository } from '../../../domain/exam/repositories/exam.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { ClassContextService } from '../../class/services/class-context.service';
import { User } from '../../../domain/user/entities/user.entity';

@Injectable()
export class GetExamUseCase {
  constructor(
    @Inject(TOKENS.EXAM_REPO) private readonly examRepo: IExamRepository,
    private readonly classContext: ClassContextService,
  ) {}

  async execute(subjectId: string, examId: string, user: User) {
    const exam = await this.examRepo.findExamById(examId);
    if (!exam) throw new NotFoundException('Exam not found');
    await this.classContext.assertAccess(subjectId, user, exam.classId);
    return exam;
  }
}
