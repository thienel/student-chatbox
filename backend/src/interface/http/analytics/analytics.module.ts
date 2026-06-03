import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { GetAdminStatsUseCase } from '../../../application/system/use-cases/get-admin-stats.use-case';
import { GetAiUsageUseCase } from '../../../application/system/use-cases/get-ai-usage.use-case';
import { TypeOrmDatabaseModule } from '../../../infrastructure/database/typeorm/typeorm.module';

@Module({
  imports: [TypeOrmDatabaseModule],
  controllers: [AnalyticsController],
  providers: [GetAdminStatsUseCase, GetAiUsageUseCase],
})
export class AnalyticsModule {}
