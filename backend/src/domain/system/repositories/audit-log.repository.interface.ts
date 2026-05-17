import { AuditLog } from '../entities/audit-log.entity';

export interface ListAuditLogsFilter {
  userId?: string;
  action?: string;
  from?: Date;
  to?: Date;
  page: number;
  limit: number;
}

export interface IAuditLogRepository {
  create(data: Partial<AuditLog>): Promise<AuditLog>;
  findAll(filter: ListAuditLogsFilter): Promise<{ items: AuditLog[]; total: number }>;
}
