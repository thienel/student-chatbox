export enum SubjectStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export class Subject {
  id: string;
  code: string;
  name: string;
  description?: string;
  status: SubjectStatus;
  createdBy?: string;
  lecturers?: { id: string; fullName: string; email: string }[];
  isEnrolled?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
