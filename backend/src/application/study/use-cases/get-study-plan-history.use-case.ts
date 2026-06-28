import { Injectable, Inject } from '@nestjs/common';
import { IStudyPlanRepository } from '../../../domain/study/repositories/study-plan.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { User } from '../../../domain/user/entities/user.entity';

const DEFAULT_LIMIT = 4;
const MAX_LIMIT = 12;

@Injectable()
export class GetStudyPlanHistoryUseCase {
  constructor(
    @Inject(TOKENS.STUDY_PLAN_REPO) private readonly planRepo: IStudyPlanRepository,
  ) {}

  async execute(user: User, limit?: number) {
    const capped = Math.min(Math.max(1, limit ?? DEFAULT_LIMIT), MAX_LIMIT);
    return this.planRepo.findRecentByUser(user.id, capped);
  }
}
