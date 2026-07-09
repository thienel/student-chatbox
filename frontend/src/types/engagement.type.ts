export interface StudentEngagementStats {
  lastActiveAt: string | null;
  currentStreak: number;
  totalStudySessions: number;
  totalCardsReviewed: number;
  totalStarsReceived: number;
  questionsPosted: number;
  answersPosted: number;
  examAttemptCount: number;
  avgExamScore: number | null;
}

export interface StudentEngagement {
  userId: string;
  fullName: string;
  email: string;
  enrolledAt: string;
  stats: StudentEngagementStats;
}

export interface StudentExamAttemptSummary {
  examId: string;
  examTitle: string;
  score: number | null;
  attemptedAt: string;
}

export interface EngagementWeakTopic {
  topic: string;
  classification: 'weak' | 'developing' | 'strong';
  totalQuestions: number;
  correctCount: number;
  correctRate: number;
}

export interface StudentEngagementDetail extends StudentEngagement {
  examAttempts: StudentExamAttemptSummary[];
  weakTopics: EngagementWeakTopic[];
}