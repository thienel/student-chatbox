/**
 * Metrics gathered from existing data to evaluate badge conditions. Board
 * metrics (questions/answers) are added when the Question Board ships.
 */
export interface BadgeMetrics {
  totalSessions: number;
  longestStreak: number;
  totalCardsReviewed: number;
  hasPublicSet: boolean;
  maxSingleSetStars: number;
  totalStarsReceived: number;
  hasPerfectExam: boolean;
  examsScored80Plus: number;
  hasPostedQuestion: boolean;
  hasPinnedAnswer: boolean;
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  iconKey: string;
  /** True when the user currently qualifies for this badge. */
  earned: (m: BadgeMetrics) => boolean;
  /** Optional short progress hint for not-yet-earned badges. */
  progress?: (m: BadgeMetrics) => string;
}

export const BADGE_CATALOGUE: BadgeDefinition[] = [
  {
    id: 'first_session', name: 'First Steps', iconKey: 'footprints',
    description: 'Complete your first study session',
    earned: (m) => m.totalSessions >= 1,
  },
  {
    id: 'streak_3', name: 'On a Roll', iconKey: 'flame',
    description: 'Reach a 3-day study streak',
    earned: (m) => m.longestStreak >= 3,
    progress: (m) => `${Math.min(m.longestStreak, 3)} / 3 days`,
  },
  {
    id: 'streak_7', name: 'Week Warrior', iconKey: 'flame',
    description: 'Reach a 7-day study streak',
    earned: (m) => m.longestStreak >= 7,
    progress: (m) => `${Math.min(m.longestStreak, 7)} / 7 days`,
  },
  {
    id: 'streak_30', name: 'Iron Will', iconKey: 'trophy',
    description: 'Reach a 30-day study streak',
    earned: (m) => m.longestStreak >= 30,
    progress: (m) => `${Math.min(m.longestStreak, 30)} / 30 days`,
  },
  {
    id: 'cards_100', name: 'Card Shark', iconKey: 'layers',
    description: 'Review 100 cards in total',
    earned: (m) => m.totalCardsReviewed >= 100,
    progress: (m) => `${Math.min(m.totalCardsReviewed, 100)} / 100 cards`,
  },
  {
    id: 'cards_500', name: 'Card Master', iconKey: 'layers',
    description: 'Review 500 cards in total',
    earned: (m) => m.totalCardsReviewed >= 500,
    progress: (m) => `${Math.min(m.totalCardsReviewed, 500)} / 500 cards`,
  },
  {
    id: 'first_share', name: 'Knowledge Sharer', iconKey: 'share',
    description: 'Publish your first public flashcard set',
    earned: (m) => m.hasPublicSet,
  },
  {
    id: 'stars_10_single', name: 'Popular Set', iconKey: 'star',
    description: 'Receive 10 stars on a single set',
    earned: (m) => m.maxSingleSetStars >= 10,
    progress: (m) => `${Math.min(m.maxSingleSetStars, 10)} / 10 stars`,
  },
  {
    id: 'stars_50_total', name: 'Star Collector', iconKey: 'sparkles',
    description: 'Receive 50 stars across all your sets',
    earned: (m) => m.totalStarsReceived >= 50,
    progress: (m) => `${Math.min(m.totalStarsReceived, 50)} / 50 stars`,
  },
  {
    id: 'exam_perfect', name: 'Exam Ace', iconKey: 'medal',
    description: 'Score 100% on any exam',
    earned: (m) => m.hasPerfectExam,
  },
  {
    id: 'exam_80_five', name: 'High Achiever', iconKey: 'medal',
    description: 'Score 80% or higher on 5 different exams',
    earned: (m) => m.examsScored80Plus >= 5,
    progress: (m) => `${Math.min(m.examsScored80Plus, 5)} / 5 exams`,
  },
  {
    id: 'first_question', name: 'Curious Mind', iconKey: 'help-circle',
    description: 'Post your first question on the board',
    earned: (m) => m.hasPostedQuestion,
  },
  {
    id: 'answer_pinned', name: 'Peer Expert', iconKey: 'pin',
    description: 'Have an answer pinned by a lecturer',
    earned: (m) => m.hasPinnedAnswer,
  },
];
