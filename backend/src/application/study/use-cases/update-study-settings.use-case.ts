import { Injectable, Inject } from '@nestjs/common';
import { IStudyRepository } from '../../../domain/study/repositories/study.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { User } from '../../../domain/user/entities/user.entity';
import { UpdateStudySettingsDto } from '../dtos/study.dto';

@Injectable()
export class UpdateStudySettingsUseCase {
  constructor(
    @Inject(TOKENS.STUDY_REPO) private readonly studyRepo: IStudyRepository,
  ) {}

  async execute(user: User, dto: UpdateStudySettingsDto) {
    return this.studyRepo.saveSettings(user.id, dto.newCardsPerDay);
  }
}
