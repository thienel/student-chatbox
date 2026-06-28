export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'lecturer' | 'student';
  status: 'active' | 'suspended';
  permissions: string[];
  createdAt: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  lecturers?: { id: string; fullName: string; email: string }[];
  isEnrolled?: boolean;
}

export interface SubjectLecturer {
  id: string;
  fullName: string;
}

export interface Class {
  id: string;
  subjectId: string;
  lecturerId: string;
  name: string;
  lecturer?: { id: string; fullName: string };
  studentCount?: number;
  createdAt: string;
}

export interface ClassStudent {
  id: string;
  fullName: string;
  email: string;
  enrolledAt: string;
}

export interface ClassStudentStat {
  id: string;
  fullName: string;
  email: string;
  examAttempts: number;
  avgScore: number | null;
  lastActiveAt: string | null;
}

export interface ClassStats {
  overview: {
    studentCount: number;
    documentCount: number;
    documentsReady: number;
    examCount: number;
    flashcardSetCount: number;
    totalAttempts: number;
    avgScore: number | null;
  };
  students: ClassStudentStat[];
}

export interface Document {
  id: string;
  originalName: string;
  mimeType: string;
  fileSizeBytes: number;
  status: 'processing' | 'ready' | 'failed';
  chunkCount: number;
  uploadedBy: { id: string; fullName: string };
  createdAt: string;
}

export interface Chat {
  id: string;
  title: string;
  subjectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageSource {
  documentId: string;
  originalName: string;
  excerpt: string;
  score: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: MessageSource[];
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page?: number;
  limit?: number;
}

export interface SystemSetting {
  key: string;
  value: string | number;
  description?: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userEmail?: string;
  userFullName?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  usersByRole: {
    admin: number;
    lecturer: number;
    student: number;
  };
  totalSubjects: number;
  totalDocuments: number;
}

// Flashcards
export interface FlashcardSet {
  id: string;
  subjectId: string;
  title: string;
  description?: string;
  isPublic: boolean;
  starCount: number;
  clonedFromId?: string;
  publishedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Flashcard {
  id: string;
  setId: string;
  front: string;
  back: string;
  position: number;
  createdAt: string;
}

export interface FlashcardSetWithCards extends FlashcardSet {
  cards: Flashcard[];
}

// Community flashcards
export interface DiscoverSetItem {
  id: string;
  title: string;
  subjectName: string;
  creatorName: string;
  cardCount: number;
  starCount: number;
  isStarredByMe: boolean;
  publishedAt: string | null;
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

// Badges
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

// Study plan
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

// Weak topics
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

// Study (FSRS)
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

// Exams
export type ExamDifficulty = 'easy' | 'medium' | 'hard';
export type ExamType = 'official' | 'ai_generated';

export interface QuestionOption {
  key: string;
  text: string;
}

export interface Question {
  id: string;
  examId: string;
  content: string;
  options: QuestionOption[];
  correctAnswer?: string;  // only in results
  explanation?: string;    // only in results
  topic?: string;
  position: number;
}

export interface OfficialQuestionInput {
  content: string;
  options: QuestionOption[];
  correctAnswer: string;
  explanation?: string;
  topic?: string;
}

export interface CreateOfficialExamInput {
  classId: string;
  title: string;
  description?: string;
  durationMinutes?: number;
  questions: OfficialQuestionInput[];
}

export interface Exam {
  id: string;
  subjectId: string;
  title: string;
  description?: string;
  type: ExamType;
  difficulty?: ExamDifficulty;
  durationMinutes: number;
  questionCount: number;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  userId: string;
  answers: Record<string, string>;
  score?: number;
  totalQuestions?: number;
  correctCount?: number;
  status: 'in_progress' | 'completed' | 'abandoned';
  startedAt: string;
  completedAt?: string;
  timeSpentSecs?: number;
  exam?: { id: string; title: string; subjectId: string };
}

// Bookmarks
export type BookmarkResourceType = 'document' | 'flashcard_set' | 'exam' | 'message';

export interface Bookmark {
  id: string;
  userId: string;
  resourceType: BookmarkResourceType;
  resourceId: string;
  note?: string;
  createdAt: string;
}

// RBAC
export interface Role {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  permissions?: string[];
  createdAt: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
}

// Analytics
export interface AiUsageStats {
  allTime: Record<string, number>;
  today: Record<string, number>;
}
