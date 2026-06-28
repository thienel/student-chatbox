import { Injectable, Inject } from '@nestjs/common';
import { IBadgeRepository } from '../../../domain/badge/badge.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { BADGE_CATALOGUE } from '../../../domain/badge/badge-catalogue';
import { BadgeService } from '../badge.service';
import { User } from '../../../domain/user/entities/user.entity';

@Injectable()
export class GetMyBadgesUseCase {
  constructor(
    @Inject(TOKENS.BADGE_REPO) private readonly badgeRepo: IBadgeRepository,
    private readonly badgeService: BadgeService,
  ) {}

  async execute(user: User) {
    // Evaluate-on-read: award anything newly earned, then report status.
    const metrics = await this.badgeService.evaluateForUser(user.id);
    const earned = await this.badgeRepo.findEarned(user.id);
    const earnedIds = new Set(earned.map((e) => e.badgeId));
    const awardedAt = new Map(earned.map((e) => [e.badgeId, e.awardedAt]));

    const earnedList = BADGE_CATALOGUE.filter((b) => earnedIds.has(b.id)).map((b) => ({
      badgeId: b.id, name: b.name, iconKey: b.iconKey, awardedAt: awardedAt.get(b.id),
    }));

    const locked = BADGE_CATALOGUE.filter((b) => !earnedIds.has(b.id)).map((b) => ({
      badgeId: b.id,
      name: b.name,
      iconKey: b.iconKey,
      description: b.description,
      progress: b.progress ? b.progress(metrics) : undefined,
    }));

    return { earned: earnedList, locked };
  }
}
