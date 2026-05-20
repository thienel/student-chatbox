import { Injectable, Inject, Logger } from '@nestjs/common';
import { IAuditLogRepository } from '../../../domain/system/repositories/audit-log.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @Inject(TOKENS.AUDIT_LOG_REPO) private readonly auditLogRepo: IAuditLogRepository,
  ) {}

  async log(
    userId: string | undefined,
    action: string,
    resourceType?: string,
    resourceId?: string,
    details?: Record<string, unknown>,
    ipAddress?: string,
  ): Promise<void> {
    try {
      await this.auditLogRepo.create({
        userId,
        action,
        resourceType,
        resourceId,
        details,
        ipAddress,
      });
    } catch (error) {
      this.logger.warn(`Failed to create audit log: ${error}`);
    }
  }
}
