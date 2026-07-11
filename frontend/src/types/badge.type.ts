export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  iconKey: string;
}

export interface EarnedBadge {
  badgeId: string;
  name: string;
  iconKey: string;
  awardedAt: string;
}

export interface LockedBadge {
  badgeId: string;
  name: string;
  iconKey: string;
  description: string;
  progress?: string;
}

export interface MyBadges {
  earned: EarnedBadge[];
  locked: LockedBadge[];
}