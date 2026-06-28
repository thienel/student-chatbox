import { BadgeMetrics } from './badge-catalogue';

export interface EarnedBadge {
  badgeId: string;
  awardedAt: Date;
}

export interface IBadgeRepository {
  /** Award a badge if the user does not already have it. */
  award(userId: string, badgeId: string): Promise<void>;
  findEarned(userId: string): Promise<EarnedBadge[]>;
  /** Gather the data points used to evaluate badge conditions. */
  getMetrics(userId: string): Promise<BadgeMetrics>;
}
