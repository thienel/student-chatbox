import { Injectable, Inject } from '@nestjs/common';
import { IStudyRepository } from '../../../domain/study/repositories/study.repository.interface';
import { IFlashcardRepository } from '../../../domain/flashcard/repositories/flashcard.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { User } from '../../../domain/user/entities/user.entity';
import { ictDateString } from '../../../shared/utils/ict-time';
import { remainingNewAllowance } from './study-stats.helpers';
import { loadStudyableSet } from './study-access.helpers';

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class StartStudySessionUseCase {
  constructor(
    @Inject(TOKENS.STUDY_REPO) private readonly studyRepo: IStudyRepository,
    @Inject(TOKENS.FLASHCARD_REPO) private readonly flashcardRepo: IFlashcardRepository,
  ) {}

  async execute(setId: string, user: User) {
    await loadStudyableSet(this.flashcardRepo, setId, user.id);

    let session = await this.studyRepo.findActiveSession(user.id, setId);
    if (session && Date.now() - session.startedAt.getTime() > SESSION_TTL_MS) {
      // Auto-abandon stale sessions (BR-F1-12); its ratings are already persisted
      // to progress, only the session record is closed.
      await this.studyRepo.updateSession(session.id, { status: 'abandoned' });
      session = null;
    }
    if (!session) {
      session = await this.studyRepo.createSession(user.id, setId);
    }

    const [stats, settings] = await Promise.all([
      this.studyRepo.getStats(user.id),
      this.studyRepo.getSettings(user.id),
    ]);
    const newLimit = remainingNewAllowance(stats, settings, ictDateString());
    const queue = await this.studyRepo.getStudyQueue(user.id, setId, newLimit);

    return {
      sessionId: session.id,
      status: session.status,
      cardsRemaining: queue.dueCards.length + queue.newCards.length,
    };
  }
}
