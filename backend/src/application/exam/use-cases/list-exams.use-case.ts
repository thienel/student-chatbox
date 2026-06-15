import { Injectable, Inject } from '@nestjs/common';
import { IExamRepository } from '../../../domain/exam/repositories/exam.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { User } from '../../../domain/user/entities/user.entity';

@Injectable()
export class ListExamsUseCase {
  constructor(
    @Inject(TOKENS.EXAM_REPO) private readonly examRepo: IExamRepository,
  ) {}

  async execute(classId: string, user: User) {
    // Exams are private to the student who generated them.
    const exams = await this.examRepo.findExamsByClassId(classId);
    return exams.filter((e) => e.createdBy === user.id);
  }
}
