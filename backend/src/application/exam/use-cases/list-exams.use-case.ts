import { Injectable, Inject } from '@nestjs/common';
import { IExamRepository } from '../../../domain/exam/repositories/exam.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { User } from '../../../domain/user/entities/user.entity';

@Injectable()
export class ListExamsUseCase {
  constructor(
    @Inject(TOKENS.EXAM_REPO) private readonly examRepo: IExamRepository,
  ) {}

  async execute(subjectId: string, user: User) {
    const all = await this.examRepo.findExamsBySubjectId(subjectId);
    // ai_generated exams: only creator and admin can see them
    return all.filter(
      (e) => e.isPublic || e.createdBy === user.id || user.roleName === 'admin',
    );
  }
}
