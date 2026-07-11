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

export interface CreateClassRequest { name: string; description?: string; code?: string; subjectId?: string; instructorId?: string; maxCapacity?: number; isActive?: boolean; password?: string; }
export interface EnrollClassRequest { code?: string; classId?: string; password?: string; }