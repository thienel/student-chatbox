import { Injectable, Inject } from '@nestjs/common';
import { IExamRepository } from '../../../domain/exam/repositories/exam.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { User } from '../../../domain/user/entities/user.entity';

@Injectable()
export class ListExamsUseCase {
  constructor(
    @Inject(TOKENS.EXAM_REPO) private readonly examRepo: IExamRepository,
  ) {}

  async execute(classId: string, _user: User) {
    // A class has a single lecturer, so class membership is the visibility gate.
    return this.examRepo.findExamsByClassId(classId);
  }
}
