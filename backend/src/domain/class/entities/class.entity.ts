export class Class {
  id: string;
  subjectId: string;
  lecturerId: string;
  name: string;
  passwordHash: string;
  lecturer?: { id: string; fullName: string };
  studentCount?: number;
  createdAt: Date;
  updatedAt: Date;
}
