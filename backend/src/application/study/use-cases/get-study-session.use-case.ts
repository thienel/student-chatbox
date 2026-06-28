import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IStudyRepository } from '../../../domain/study/repositories/study.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { User } from '../../../domain/user/entities/user.entity';

@Injectable()
export class GetStudySessionUseCase {
  constructor(
    @Inject(TOKENS.STUDY_REPO) private readonly studyRepo: IStudyRepository,
  ) {}

  async execute(sessionId: string, user: User) {
    const session = await this.studyRepo.getSessionById(sessionId);
    if (!session) throw new NotFoundException('Study session not found');
    if (session.userId !== user.id) throw new ForbiddenException('Not your session');
    return session;
  }
}
