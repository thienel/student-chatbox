import {
  Injectable, Inject, NotFoundException, ForbiddenException, ConflictException,
} from '@nestjs/common';
import { IStudyRepository } from '../../../domain/study/repositories/study.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { User } from '../../../domain/user/entities/user.entity';
import { FsrsScheduler, Rating } from '../../../domain/study/services/fsrs-scheduler';
import { ictDateString } from '../../../shared/utils/ict-time';
import { ReviewCardDto } from '../dtos/study.dto';
import {
  defaultStats, applyReview, applySessionCompletion, remainingNewAllowance,
} from './study-stats.helpers';

@Injectable()
export class ReviewCardUseCase {
  private readonly scheduler = new FsrsScheduler();

  constructor(
    @Inject(TOKENS.STUDY_REPO) private readonly studyRepo: IStudyRepository,
  ) {}

  async execute(sessionId: string, dto: ReviewCardDto, user: User) {
    const session = await this.studyRepo.getSessionById(sessionId);
    if (!session) throw new NotFoundException('Study session not found');
    if (session.userId !== user.id) throw new ForbiddenException('Not your session');
    if (session.status !== 'active') {
      throw new ConflictException('Study session is no longer active');
    }

    const belongs = await this.studyRepo.cardBelongsToSet(dto.flashcardId, session.flashcardSetId);
    if (!belongs) throw new ConflictException('Card does not belong to this session');

    const rating = dto.rating as Rating;
    const now = new Date();
    const progress = await this.studyRepo.getProgress(user.id, dto.flashcardId);
    const wasNew = !progress;
    const elapsedDays = progress
      ? Math.max(0, (now.getTime() - progress.lastReviewedAt.getTime()) / 86_400_000)
      : 0;

    // BR-F1-17: only the first two Again ratings re-queue a card.  This is
    // state for this session/card pair, not an inference from durable FSRS
    // interval state that would accidentally carry into another session.
    const lapseCount = rating === 1
      ? await this.studyRepo.incrementSessionLapse(sessionId, dto.flashcardId)
      : 0;
    const maxLapsesReached = lapseCount > 2;

    const result = this.scheduler.schedule(
      progress ? { stability: progress.stability, difficulty: progress.difficulty, reps: progress.reps } : null,
      rating,
      now,
      elapsedDays,
      maxLapsesReached,
    );

    await this.studyRepo.upsertProgress({
      userId: user.id,
      flashcardId: dto.flashcardId,
      stability: result.stability,
      difficulty: result.difficulty,
      interval: result.interval,
      reps: (progress?.reps ?? 0) + 1,
      lastRating: rating,
      lastReviewedAt: now,
      nextReviewAt: result.nextReviewAt,
    });

    // Atomic increment avoids lost counts for two concurrent review requests.
    await this.studyRepo.incrementSessionCounters(sessionId, rating);

    const today = ictDateString();
    let stats = (await this.studyRepo.getStats(user.id)) ?? defaultStats(user.id);
    stats = applyReview(stats, wasNew, today);

    // The session is complete once the queue (due + remaining new) is empty.
    const settings = await this.studyRepo.getSettings(user.id);
    const newLimit = remainingNewAllowance(stats, settings, today);
    const queue = await this.studyRepo.getStudyQueue(user.id, session.flashcardSetId, newLimit);
    const sessionComplete = queue.dueCards.length + queue.newCards.length === 0;

    if (sessionComplete) {
      stats = applySessionCompletion(stats, today);
      await this.studyRepo.updateSession(sessionId, { status: 'completed', completedAt: now });
    }

    await this.studyRepo.saveStats(stats);

    return {
      nextReviewAt: result.nextReviewAt,
      interval: result.interval,
      stability: result.stability,
      difficulty: result.difficulty,
      sessionComplete,
    };
  }
}
