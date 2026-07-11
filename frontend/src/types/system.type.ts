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

export interface AiUsageStats {
  allTime: Record<string, number>;
  today: Record<string, number>;
}