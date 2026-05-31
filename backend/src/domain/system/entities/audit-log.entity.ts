export class AuditLog {
  id: string;
  userId?: string;
  userEmail?: string;
  userFullName?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
}
