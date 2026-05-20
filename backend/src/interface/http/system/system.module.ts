import { Module } from '@nestjs/common';
import { SystemController } from './system.controller';
import { GetSettingsUseCase } from '../../../application/system/use-cases/get-settings.use-case';
import { UpdateSettingsUseCase } from '../../../application/system/use-cases/update-settings.use-case';
import { ListAuditLogsUseCase } from '../../../application/system/use-cases/list-audit-logs.use-case';
import { TypeOrmDatabaseModule } from '../../../infrastructure/database/typeorm/typeorm.module';
import { AuditLogService } from '../../../application/system/services/audit-log.service';

@Module({
  imports: [TypeOrmDatabaseModule],
  controllers: [SystemController],
  providers: [
    GetSettingsUseCase,
    UpdateSettingsUseCase,
    ListAuditLogsUseCase,
    AuditLogService,
  ],
})
export class SystemModule {}
