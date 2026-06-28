import { FlashcardSet } from '../entities/flashcard-set.entity';
import { Flashcard } from '../entities/flashcard.entity';

export interface DiscoverSetItem {
  id: string;
  title: string;
  subjectName: string;
  creatorName: string;
  cardCount: number;
  starCount: number;
  isStarredByMe: boolean;
  publishedAt: Date | null;
}

export interface DiscoverSetsQuery {
  userId: string;
  subjectId?: string;
  sort: 'stars' | 'newest';
  page: number;
  pageSize: number;
}

export interface DiscoverSetsResult {
  items: DiscoverSetItem[];
  total: number;
  page: number;
  pageSize: number;
}

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

export interface IFlashcardRepository {
  createSet(data: Partial<FlashcardSet>): Promise<FlashcardSet>;
  findSetById(id: string): Promise<FlashcardSet | null>;
  findSetsBySubjectId(subjectId: string): Promise<FlashcardSet[]>;
  findSetsByClassId(classId: string): Promise<FlashcardSet[]>;
  deleteSet(id: string): Promise<void>;
  setVisibility(setId: string, isPublic: boolean): Promise<FlashcardSet>;

  createCards(cards: Array<{ setId: string; front: string; back: string; position: number }>): Promise<Flashcard[]>;
  findCardsBySetId(setId: string): Promise<Flashcard[]>;
  countCardsBySetId(setId: string): Promise<number>;

  addStar(setId: string, userId: string): Promise<{ added: boolean; starCount: number }>;
  removeStar(setId: string, userId: string): Promise<{ removed: boolean; starCount: number }>;
  discoverPublicSets(query: DiscoverSetsQuery): Promise<DiscoverSetsResult>;
  getLeaderboard(userId: string, subjectId?: string): Promise<LeaderboardResult>;
  cloneSet(setId: string, userId: string, classId?: string): Promise<{ set: FlashcardSet; cards: Flashcard[] }>;
}
