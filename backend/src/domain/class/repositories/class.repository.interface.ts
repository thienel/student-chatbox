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
  /** Remove the student's membership from whatever class they belong to in the subject. */
  unenrollStudentFromSubject(subjectId: string, studentId: string): Promise<void>;
  /** The class a student belongs to within a subject, if any. */
  findStudentClassInSubject(subjectId: string, studentId: string): Promise<Class | null>;
}
