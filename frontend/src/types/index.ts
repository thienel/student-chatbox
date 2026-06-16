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
  position: number;
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
