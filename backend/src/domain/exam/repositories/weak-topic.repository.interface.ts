export type TopicClassification = 'weak' | 'developing' | 'strong';

export interface WeakTopic {
  topic: string;
  classification: TopicClassification;
  totalQuestions: number;
  correctCount: number;
  correctRate: number;
}

export interface SuggestedSet {
  id: string;
  title: string;
  starCount: number;
}

export interface IWeakTopicRepository {
  /**
   * Recompute a student's all-time per-topic performance for a subject and
   * persist the classification (weak/developing/strong). Topics with fewer
   * than the minimum sampled questions are dropped (insufficient data).
   */
  recompute(userId: string, subjectId: string): Promise<void>;
  findByUserSubject(userId: string, subjectId: string): Promise<WeakTopic[]>;
  /** Up to `limit` public flashcard sets whose title matches the topic, by stars. */
  suggestSets(topic: string, limit: number): Promise<SuggestedSet[]>;
}
