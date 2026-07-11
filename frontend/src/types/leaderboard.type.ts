export interface LeaderboardEntry {
  rank: number;
  userId: string;
  fullName: string;
  totalStars: number;
  totalPublicSets: number;
}

export interface LeaderboardResult {
  scope: 'global' | 'subject';
  items: LeaderboardEntry[];
  myRank: { rank: number; totalStars: number; totalPublicSets: number } | null;
}