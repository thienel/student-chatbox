import { Injectable, Inject } from '@nestjs/common';
import { IBadgeRepository } from '../../../domain/badge/badge.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { BADGE_CATALOGUE } from '../../../domain/badge/badge-catalogue';

@Injectable()
export class GetUserBadgesUseCase {
  constructor(
    @Inject(TOKENS.BADGE_REPO) private readonly badgeRepo: IBadgeRepository,
  ) {}

  async execute(userId: string) {
    const earned = await this.badgeRepo.findEarned(userId);
    const byId = new Map(BADGE_CATALOGUE.map((b) => [b.id, b]));
    return {
      earned: earned
        .filter((e) => byId.has(e.badgeId))
        .map((e) => {
          const def = byId.get(e.badgeId)!;
          return { badgeId: e.badgeId, name: def.name, iconKey: def.iconKey, awardedAt: e.awardedAt };
        }),
      total: earned.length,
    };
  }
}
