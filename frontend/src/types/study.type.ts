export type StudyTaskType = 'review_flashcards' | 'study_topic' | 'take_exam';

export interface StudyPlanTask {
  type: StudyTaskType;
  title: string;
  description: string;
  resourceType?: string;
  resourceId?: string;
  estimatedMinutes: number;
}

export interface StudyPlanDay {
  date: string;
  dayName: string;
  tasks: StudyPlanTask[];
  totalEstimatedMinutes: number;
}

export interface StudyPlan {
  id: string;
  userId: string;
  weekStartDate: string;
  planVersion: number;
  planData: { days: StudyPlanDay[] };
  generatedAt: string;
}

export type TopicClassification = 'weak' | 'developing' | 'strong';

export interface SuggestedSet {
  id: string;
  title: string;
  starCount: number;
}

export interface WeakTopic {
  topic: string;
  classification: TopicClassification;
  totalQuestions: number;
  correctCount: number;
  correctRate: number;
  suggestedFlashcardSets: SuggestedSet[];
}

export interface MyWeakTopics {
  subjectId: string;
  topics: WeakTopic[];
}

export interface StudyQueueCard {
  flashcardId: string;
  front: string;
  back: string;
  position: number;
  isNew: boolean;
  currentStability: number | null;
  currentDifficulty: number | null;
}

export interface StudyQueue {
  sessionId: string | null;
  dueCards: number;
  newCards: number;
  totalQueue: number;
  nextDueAt: string | null;
  cards: StudyQueueCard[];
}

export interface StudySessionStart {
  sessionId: string;
  status: 'active' | 'completed' | 'abandoned';
  cardsRemaining: number;
}

export type CardRating = 1 | 2 | 3 | 4; // again | hard | good | easy

export interface ReviewResult {
  nextReviewAt: string;
  interval: number;
  stability: number;
  difficulty: number;
  sessionComplete: boolean;
}

export interface StudySettings {
  userId: string;
  newCardsPerDay: number;
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