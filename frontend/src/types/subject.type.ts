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

export interface CreateSubjectRequest { code: string; name: string; description?: string; credits?: number; }
export interface UpdateSubjectRequest { name?: string; description?: string; credits?: number; }