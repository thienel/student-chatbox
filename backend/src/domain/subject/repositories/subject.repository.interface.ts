import { Subject, SubjectStatus } from '../entities/subject.entity';

export interface ListSubjectsFilter {
  status?: SubjectStatus;
  page: number;
  limit: number;
  lecturerId?: string;
  studentId?: string;
  search?: string;
}

export interface ISubjectRepository {
  findById(id: string): Promise<Subject | null>;
  findByCode(code: string): Promise<Subject | null>;
  findAll(filter: ListSubjectsFilter): Promise<{ items: Subject[]; total: number }>;
  create(subject: Partial<Subject>): Promise<Subject>;
  update(id: string, data: Partial<Subject>): Promise<Subject>;
  delete(id: string): Promise<void>;
  assignLecturer(subjectId: string, lecturerId: string, assignedBy: string): Promise<void>;
  removeLecturer(subjectId: string, lecturerId: string): Promise<void>;
  isLecturerAssigned(subjectId: string, lecturerId: string): Promise<boolean>;
  enrollStudent(subjectId: string, studentId: string): Promise<void>;
  unenrollStudent(subjectId: string, studentId: string): Promise<void>;
  isStudentEnrolled(subjectId: string, studentId: string): Promise<boolean>;
}
