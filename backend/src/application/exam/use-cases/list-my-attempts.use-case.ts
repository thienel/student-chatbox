import { Injectable, Inject } from '@nestjs/common';
import { IExamRepository } from '../../../domain/exam/repositories/exam.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { User } from '../../../domain/user/entities/user.entity';

@Injectable()
export class ListMyAttemptsUseCase {
  constructor(
    @Inject(TOKENS.EXAM_REPO) private readonly examRepo: IExamRepository,
  ) {}

  async execute(user: User) {
    return this.examRepo.findAttemptsByUserId(user.id);
  }
}
