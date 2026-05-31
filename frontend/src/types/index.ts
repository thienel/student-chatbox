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
