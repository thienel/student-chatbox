import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { IBadgeRepository, EarnedBadge } from '../../../../domain/badge/badge.repository.interface';
import { BadgeMetrics } from '../../../../domain/badge/badge-catalogue';
import { UserBadgeOrmEntity } from '../orm-entities/user-badge.orm-entity';

const PERFECT_SCORE = 10; // exam scores are out of 10
const SCORE_80 = 8;

@Injectable()
export class BadgeTypeOrmRepository implements IBadgeRepository {
  constructor(
    @InjectRepository(UserBadgeOrmEntity)
    private readonly repo: Repository<UserBadgeOrmEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async award(userId: string, badgeId: string): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .insert()
      .into(UserBadgeOrmEntity)
      .values({ userId, badgeId })
      .orIgnore()
      .execute();
  }

  async findEarned(userId: string): Promise<EarnedBadge[]> {
    const rows = await this.repo.find({ where: { userId }, order: { awardedAt: 'ASC' } });
    return rows.map((r) => ({ badgeId: r.badgeId, awardedAt: r.awardedAt }));
  }

  async getMetrics(userId: string): Promise<BadgeMetrics> {
    const [study] = await this.dataSource.query(
      `SELECT total_sessions AS "totalSessions", longest_streak AS "longestStreak",
         total_cards_reviewed AS "totalCardsReviewed"
       FROM student_study_stats WHERE user_id = $1`,
      [userId],
    );

    const [sets] = await this.dataSource.query(
      `SELECT
         COALESCE(bool_or(is_public), false) AS "hasPublicSet",
         COALESCE(MAX(star_count), 0)::int AS "maxSingleSetStars",
         COALESCE(SUM(star_count) FILTER (WHERE is_public), 0)::int AS "totalStarsReceived"
       FROM flashcard_sets WHERE created_by = $1`,
      [userId],
    );

    const [exams] = await this.dataSource.query(
      `SELECT
         COALESCE(bool_or(score >= $2), false) AS "hasPerfectExam",
         COUNT(DISTINCT exam_id) FILTER (WHERE score >= $3)::int AS "examsScored80Plus"
       FROM exam_attempts WHERE user_id = $1 AND status = 'completed'`,
      [userId, PERFECT_SCORE, SCORE_80],
    );

    return {
      totalSessions: study?.totalSessions ?? 0,
      longestStreak: study?.longestStreak ?? 0,
      totalCardsReviewed: study?.totalCardsReviewed ?? 0,
      hasPublicSet: sets?.hasPublicSet ?? false,
      maxSingleSetStars: sets?.maxSingleSetStars ?? 0,
      totalStarsReceived: sets?.totalStarsReceived ?? 0,
      hasPerfectExam: exams?.hasPerfectExam ?? false,
      examsScored80Plus: exams?.examsScored80Plus ?? 0,
    };
  }
}
