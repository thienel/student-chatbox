export interface StudyPlanTask {
  type: 'review_flashcards' | 'study_topic' | 'take_exam';
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

export interface StudyPlanData {
  days: StudyPlanDay[];
}

export interface StudyPlan {
  id: string;
  userId: string;
  weekStartDate: string;
  planVersion: number;
  planData: StudyPlanData;
  generatedAt: Date;
}

export interface IStudyPlanRepository {
  findByUserAndWeek(userId: string, weekStartDate: string): Promise<StudyPlan | null>;
  create(userId: string, weekStartDate: string, planData: StudyPlanData): Promise<StudyPlan>;
  findRecentByUser(userId: string, limit: number): Promise<StudyPlan[]>;
}
