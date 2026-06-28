import { Injectable, Inject } from '@nestjs/common';
import { IStudyRepository } from '../../../domain/study/repositories/study.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { User } from '../../../domain/user/entities/user.entity';
import { defaultStats } from './study-stats.helpers';

@Injectable()
export class GetStudyStatsUseCase {
  constructor(
    @Inject(TOKENS.STUDY_REPO) private readonly studyRepo: IStudyRepository,
  ) {}

  async execute(user: User) {
    return (await this.studyRepo.getStats(user.id)) ?? defaultStats(user.id);
  }
}
