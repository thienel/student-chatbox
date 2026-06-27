import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  IStudyRepository, StudyQueue, CardProgress, UpsertProgressInput,
  StudySession, StudyStats, StudySettings,
} from '../../../../domain/study/repositories/study.repository.interface';
import { FlashcardProgressOrmEntity } from '../orm-entities/flashcard-progress.orm-entity';
import { FlashcardStudySessionOrmEntity } from '../orm-entities/flashcard-study-session.orm-entity';
import { StudentStudyStatsOrmEntity } from '../orm-entities/student-study-stats.orm-entity';
import { StudentStudySettingsOrmEntity } from '../orm-entities/student-study-settings.orm-entity';
import { FlashcardOrmEntity } from '../orm-entities/flashcard.orm-entity';

@Injectable()
export class StudyTypeOrmRepository implements IStudyRepository {
  constructor(
    @InjectRepository(FlashcardProgressOrmEntity)
    private readonly progressRepo: Repository<FlashcardProgressOrmEntity>,
    @InjectRepository(FlashcardStudySessionOrmEntity)
    private readonly sessionRepo: Repository<FlashcardStudySessionOrmEntity>,
    @InjectRepository(StudentStudyStatsOrmEntity)
    private readonly statsRepo: Repository<StudentStudyStatsOrmEntity>,
    @InjectRepository(StudentStudySettingsOrmEntity)
    private readonly settingsRepo: Repository<StudentStudySettingsOrmEntity>,
    @InjectRepository(FlashcardOrmEntity)
    private readonly cardRepo: Repository<FlashcardOrmEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async getStudyQueue(userId: string, setId: string, newCardLimit: number): Promise<StudyQueue> {
    const dueCards = await this.dataSource.query(
      `SELECT f.id AS "flashcardId", f.front, f.back, f.position,
         false AS "isNew", p.stability AS "currentStability", p.difficulty AS "currentDifficulty"
       FROM flashcards f
       JOIN flashcard_progress p ON p.flashcard_id = f.id AND p.user_id = $1
       WHERE f.set_id = $2 AND p.next_review_at <= now()
       ORDER BY p.next_review_at ASC`,
      [userId, setId],
    );

    const newCards = newCardLimit > 0
      ? await this.dataSource.query(
          `SELECT f.id AS "flashcardId", f.front, f.back, f.position,
             true AS "isNew", NULL AS "currentStability", NULL AS "currentDifficulty"
           FROM flashcards f
           LEFT JOIN flashcard_progress p ON p.flashcard_id = f.id AND p.user_id = $1
           WHERE f.set_id = $2 AND p.id IS NULL
           ORDER BY f.position ASC
           LIMIT $3`,
          [userId, setId, newCardLimit],
        )
      : [];

    const [{ next }] = await this.dataSource.query(
      `SELECT MIN(p.next_review_at) AS next
       FROM flashcards f
       JOIN flashcard_progress p ON p.flashcard_id = f.id AND p.user_id = $1
       WHERE f.set_id = $2 AND p.next_review_at > now()`,
      [userId, setId],
    );

    return { dueCards, newCards, nextDueAt: next ?? null };
  }

  async cardBelongsToSet(flashcardId: string, setId: string): Promise<boolean> {
    return (await this.cardRepo.count({ where: { id: flashcardId, setId } })) > 0;
  }

  async getProgress(userId: string, flashcardId: string): Promise<CardProgress | null> {
    const o = await this.progressRepo.findOne({ where: { userId, flashcardId } });
    if (!o) return null;
    return { stability: o.stability, difficulty: o.difficulty, reps: o.reps, lastReviewedAt: o.lastReviewedAt };
  }

  async upsertProgress(input: UpsertProgressInput): Promise<void> {
    await this.progressRepo.upsert(
      {
        userId: input.userId,
        flashcardId: input.flashcardId,
        stability: input.stability,
        difficulty: input.difficulty,
        interval: input.interval,
        reps: input.reps,
        lastRating: input.lastRating,
        lastReviewedAt: input.lastReviewedAt,
        nextReviewAt: input.nextReviewAt,
      },
      ['userId', 'flashcardId'],
    );
  }

  private toSession(o: FlashcardStudySessionOrmEntity): StudySession {
    return {
      id: o.id, userId: o.userId, flashcardSetId: o.flashcardSetId, status: o.status,
      cardsStudied: o.cardsStudied, cardsAgain: o.cardsAgain, cardsHard: o.cardsHard,
      cardsGood: o.cardsGood, cardsEasy: o.cardsEasy,
      startedAt: o.startedAt, completedAt: o.completedAt,
    };
  }

  async findActiveSession(userId: string, setId: string): Promise<StudySession | null> {
    const o = await this.sessionRepo.findOne({
      where: { userId, flashcardSetId: setId, status: 'active' },
    });
    return o ? this.toSession(o) : null;
  }

  async createSession(userId: string, setId: string): Promise<StudySession> {
    const saved = await this.sessionRepo.save(
      this.sessionRepo.create({ userId, flashcardSetId: setId, status: 'active' }),
    );
    return this.toSession(saved);
  }

  async getSessionById(id: string): Promise<StudySession | null> {
    const o = await this.sessionRepo.findOne({ where: { id } });
    return o ? this.toSession(o) : null;
  }

  async updateSession(id: string, data: Partial<StudySession>): Promise<StudySession> {
    await this.sessionRepo.update(id, {
      status: data.status,
      cardsStudied: data.cardsStudied,
      cardsAgain: data.cardsAgain,
      cardsHard: data.cardsHard,
      cardsGood: data.cardsGood,
      cardsEasy: data.cardsEasy,
      completedAt: data.completedAt ?? undefined,
    });
    const updated = await this.sessionRepo.findOneOrFail({ where: { id } });
    return this.toSession(updated);
  }

  async getStats(userId: string): Promise<StudyStats | null> {
    const o = await this.statsRepo.findOne({ where: { userId } });
    return o ?? null;
  }

  async saveStats(stats: StudyStats): Promise<StudyStats> {
    await this.statsRepo.upsert(stats, ['userId']);
    return stats;
  }

  async getSettings(userId: string): Promise<StudySettings | null> {
    const o = await this.settingsRepo.findOne({ where: { userId } });
    return o ? { userId: o.userId, newCardsPerDay: o.newCardsPerDay } : null;
  }

  async saveSettings(userId: string, newCardsPerDay: number): Promise<StudySettings> {
    await this.settingsRepo.upsert({ userId, newCardsPerDay }, ['userId']);
    return { userId, newCardsPerDay };
  }
}
