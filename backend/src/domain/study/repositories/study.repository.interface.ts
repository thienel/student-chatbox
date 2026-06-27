export interface QueueCard {
  flashcardId: string;
  front: string;
  back: string;
  position: number;
  isNew: boolean;
  currentStability: number | null;
  currentDifficulty: number | null;
}

export interface StudyQueue {
  dueCards: QueueCard[];
  newCards: QueueCard[];
  nextDueAt: Date | null;
}

export interface CardProgress {
  stability: number;
  difficulty: number;
  reps: number;
  lastReviewedAt: Date;
}

export interface UpsertProgressInput {
  userId: string;
  flashcardId: string;
  stability: number;
  difficulty: number;
  interval: number;
  reps: number;
  lastRating: number;
  lastReviewedAt: Date;
  nextReviewAt: Date;
}

export interface StudySession {
  id: string;
  userId: string;
  flashcardSetId: string;
  status: 'active' | 'completed' | 'abandoned';
  cardsStudied: number;
  cardsAgain: number;
  cardsHard: number;
  cardsGood: number;
  cardsEasy: number;
  startedAt: Date;
  completedAt: Date | null;
}

export interface StudyStats {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  totalSessions: number;
  totalCardsReviewed: number;
  lastStudiedDate: string | null;
  newCardsStudiedToday: number;
  newCardsTodayDate: string | null;
}

export interface StudySettings {
  userId: string;
  newCardsPerDay: number;
}

export interface IStudyRepository {
  /** Due cards (review now) plus up to `newCardLimit` brand new cards for a set. */
  getStudyQueue(userId: string, setId: string, newCardLimit: number): Promise<StudyQueue>;
  cardBelongsToSet(flashcardId: string, setId: string): Promise<boolean>;
  /** Total cards due for review now across all of a student's studied sets. */
  countDueCards(userId: string): Promise<number>;

  getProgress(userId: string, flashcardId: string): Promise<CardProgress | null>;
  upsertProgress(input: UpsertProgressInput): Promise<void>;

  findActiveSession(userId: string, setId: string): Promise<StudySession | null>;
  createSession(userId: string, setId: string): Promise<StudySession>;
  getSessionById(id: string): Promise<StudySession | null>;
  updateSession(id: string, data: Partial<StudySession>): Promise<StudySession>;

  getStats(userId: string): Promise<StudyStats | null>;
  saveStats(stats: StudyStats): Promise<StudyStats>;

  getSettings(userId: string): Promise<StudySettings | null>;
  saveSettings(userId: string, newCardsPerDay: number): Promise<StudySettings>;
}
