import { Injectable, Inject } from '@nestjs/common';
import { IBadgeRepository } from '../../domain/badge/badge.repository.interface';
import { TOKENS } from '../../shared/constants/tokens';
import { BADGE_CATALOGUE, BadgeMetrics } from '../../domain/badge/badge-catalogue';

@Injectable()
export class BadgeService {
  constructor(
    @Inject(TOKENS.BADGE_REPO) private readonly badgeRepo: IBadgeRepository,
  ) {}

  /**
   * Idempotently award any newly-earned badges for a user from current data.
   * Safe to call after any triggering action or on read; a badge is awarded at
   * most once. Returns the metrics so callers can build progress hints.
   */
  async evaluateForUser(userId: string): Promise<BadgeMetrics> {
    const metrics = await this.badgeRepo.getMetrics(userId);
    const earned = new Set((await this.badgeRepo.findEarned(userId)).map((b) => b.badgeId));

    for (const badge of BADGE_CATALOGUE) {
      if (!earned.has(badge.id) && badge.earned(metrics)) {
        await this.badgeRepo.award(userId, badge.id);
      }
    }
    return metrics;
  }
}
