import { Injectable, Inject } from '@nestjs/common';
import { IStudyRepository } from '../../../domain/study/repositories/study.repository.interface';
import { IFlashcardRepository } from '../../../domain/flashcard/repositories/flashcard.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { User } from '../../../domain/user/entities/user.entity';
import { ictDateString } from '../../../shared/utils/ict-time';
import { remainingNewAllowance } from './study-stats.helpers';
import { loadStudyableSet } from './study-access.helpers';

@Injectable()
export class GetStudyQueueUseCase {
  constructor(
    @Inject(TOKENS.STUDY_REPO) private readonly studyRepo: IStudyRepository,
    @Inject(TOKENS.FLASHCARD_REPO) private readonly flashcardRepo: IFlashcardRepository,
  ) {}

  async execute(setId: string, user: User) {
    await loadStudyableSet(this.flashcardRepo, setId, user.id);

    const [stats, settings] = await Promise.all([
      this.studyRepo.getStats(user.id),
      this.studyRepo.getSettings(user.id),
    ]);
    const today = ictDateString();
    const newLimit = remainingNewAllowance(stats, settings, today);

    const queue = await this.studyRepo.getStudyQueue(user.id, setId, newLimit);
    const active = await this.studyRepo.findActiveSession(user.id, setId);

    const cards = [...queue.dueCards, ...queue.newCards];
    return {
      sessionId: active?.id ?? null,
      dueCards: queue.dueCards.length,
      newCards: queue.newCards.length,
      totalQueue: cards.length,
      nextDueAt: queue.nextDueAt,
      cards,
    };
  }
}
