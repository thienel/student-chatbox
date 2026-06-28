import { Module } from '@nestjs/common';
import { StudyController } from './study.controller';
import { GetStudyQueueUseCase } from '../../../application/study/use-cases/get-study-queue.use-case';
import { StartStudySessionUseCase } from '../../../application/study/use-cases/start-study-session.use-case';
import { ReviewCardUseCase } from '../../../application/study/use-cases/review-card.use-case';
import { GetStudySessionUseCase } from '../../../application/study/use-cases/get-study-session.use-case';
import { GetStudySettingsUseCase } from '../../../application/study/use-cases/get-study-settings.use-case';
import { UpdateStudySettingsUseCase } from '../../../application/study/use-cases/update-study-settings.use-case';
import { GetStudyStatsUseCase } from '../../../application/study/use-cases/get-study-stats.use-case';
import { GetCurrentStudyPlanUseCase } from '../../../application/study/use-cases/get-current-study-plan.use-case';
import { GetStudyPlanHistoryUseCase } from '../../../application/study/use-cases/get-study-plan-history.use-case';
import { TypeOrmDatabaseModule } from '../../../infrastructure/database/typeorm/typeorm.module';

@Module({
  imports: [TypeOrmDatabaseModule],
  controllers: [StudyController],
  providers: [
    GetStudyQueueUseCase,
    StartStudySessionUseCase,
    ReviewCardUseCase,
    GetStudySessionUseCase,
    GetStudySettingsUseCase,
    UpdateStudySettingsUseCase,
    GetStudyStatsUseCase,
    GetCurrentStudyPlanUseCase,
    GetStudyPlanHistoryUseCase,
  ],
})
export class StudyModule {}
