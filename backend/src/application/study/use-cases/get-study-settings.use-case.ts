import { Injectable, Inject } from '@nestjs/common';
import { IStudyRepository } from '../../../domain/study/repositories/study.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { User } from '../../../domain/user/entities/user.entity';
import { DEFAULT_NEW_CARDS_PER_DAY } from './study-stats.helpers';

@Injectable()
export class GetStudySettingsUseCase {
  constructor(
    @Inject(TOKENS.STUDY_REPO) private readonly studyRepo: IStudyRepository,
  ) {}

  async execute(user: User) {
    const settings = await this.studyRepo.getSettings(user.id);
    return settings ?? { userId: user.id, newCardsPerDay: DEFAULT_NEW_CARDS_PER_DAY };
  }
}
