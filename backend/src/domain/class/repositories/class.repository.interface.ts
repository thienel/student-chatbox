import { Class } from '../entities/class.entity';

export interface ISubjectLecturer {
  id: string;
  fullName: string;
}

export interface IClassStudent {
  id: string;
  fullName: string;
  email: string;
  enrolledAt: Date;
}

export interface IClassStudentStat {
  id: string;
  fullName: string;
  email: string;
  examAttempts: number;
  avgScore: number | null;
  lastActiveAt: Date | null;
}

export interface IStudentEngagementStats {
  lastActiveAt: Date | null;
  currentStreak: number;
  totalStudySessions: number;
  totalCardsReviewed: number;
  totalStarsReceived: number;
  questionsPosted: number;
  answersPosted: number;
  examAttemptCount: number;
  avgExamScore: number | null;
}

export interface IStudentEngagement {
  userId: string;
  fullName: string;
  email: string;
  enrolledAt: Date;
  stats: IStudentEngagementStats;
}

export interface IStudentExamAttempt {
  examId: string;
  examTitle: string;
  score: number | null;
  attemptedAt: Date;
}

export interface IClassStats {
  overview: {
    studentCount: number;
    documentCount: number;
    documentsReady: number;
    examCount: number;
    flashcardSetCount: number;
    totalAttempts: number;
    avgScore: number | null;
  };
  students: IClassStudentStat[];
}

export interface IClassRepository {
  create(data: { subjectId: string; lecturerId: string; name: string; passwordHash: string }): Promise<Class>;
  findById(id: string): Promise<Class | null>;
  /** All classes in a subject (with lecturer + studentCount), for lecturer/admin management. */
  listBySubject(subjectId: string): Promise<Class[]>;
  /** Classes owned by a lecturer in a subject — includes passwordHash for verification. */
  listBySubjectAndLecturer(subjectId: string, lecturerId: string): Promise<Class[]>;
  /** Lecturers that have at least one class in the subject (for the student enroll dropdown). */
  listLecturersWithClasses(subjectId: string): Promise<ISubjectLecturer[]>;
  enrollStudent(classId: string, studentId: string): Promise<void>;
  listStudents(classId: string): Promise<IClassStudent[]>;
  removeStudent(classId: string, studentId: string): Promise<void>;
  getClassStats(classId: string): Promise<IClassStats>;
  /** All-time engagement stats per enrolled student (for lecturers). */
  getClassEngagement(subjectId: string, classId: string): Promise<IStudentEngagement[]>;
  /** A student's completed exam attempts within a subject. */
  getStudentExamAttempts(subjectId: string, studentId: string): Promise<IStudentExamAttempt[]>;
  /** Remove the student's membership from whatever class they belong to in the subject. */
  unenrollStudentFromSubject(subjectId: string, studentId: string): Promise<void>;
  /** The class a student belongs to within a subject, if any. */
  findStudentClassInSubject(subjectId: string, studentId: string): Promise<Class | null>;
}
