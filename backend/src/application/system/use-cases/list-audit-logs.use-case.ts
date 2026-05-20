import { Injectable, Inject } from '@nestjs/common';
import { IAuditLogRepository } from '../../../domain/system/repositories/audit-log.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { ListAuditLogsDto } from '../dtos/system.dto';
import { AuditLog } from '../../../domain/system/entities/audit-log.entity';

@Injectable()
export class ListAuditLogsUseCase {
  constructor(
    @Inject(TOKENS.AUDIT_LOG_REPO) private readonly auditLogRepo: IAuditLogRepository,
  ) {}

  async execute(dto: ListAuditLogsDto): Promise<{ items: AuditLog[]; total: number }> {
    return this.auditLogRepo.findAll({
      userId: dto.userId,
      action: dto.action,
      from: dto.from ? new Date(dto.from) : undefined,
      to: dto.to ? new Date(dto.to) : undefined,
      page: dto.page ?? 1,
      limit: dto.limit ?? 50,
    });
  }
}
