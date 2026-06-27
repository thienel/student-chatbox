import { Module } from '@nestjs/common';
import { SubjectExamController, ExamAttemptController } from './exam.controller';
import { WeakTopicController } from './weak-topic.controller';
import { GetMyWeakTopicsUseCase } from '../../../application/exam/use-cases/get-my-weak-topics.use-case';
import { GenerateExamUseCase } from '../../../application/exam/use-cases/generate-exam.use-case';
import { ListExamsUseCase } from '../../../application/exam/use-cases/list-exams.use-case';
import { GetExamUseCase } from '../../../application/exam/use-cases/get-exam.use-case';
import { StartAttemptUseCase } from '../../../application/exam/use-cases/start-attempt.use-case';
import { SubmitAttemptUseCase } from '../../../application/exam/use-cases/submit-attempt.use-case';
import { GetAttemptResultUseCase } from '../../../application/exam/use-cases/get-attempt-result.use-case';
import { ListMyAttemptsUseCase } from '../../../application/exam/use-cases/list-my-attempts.use-case';
import { CreateOfficialExamUseCase } from '../../../application/exam/use-cases/create-official-exam.use-case';
import { UpdateOfficialExamUseCase } from '../../../application/exam/use-cases/update-official-exam.use-case';
import { TypeOrmDatabaseModule } from '../../../infrastructure/database/typeorm/typeorm.module';
import { AiModule } from '../../../infrastructure/ai/ai.module';
import { ClassModule } from '../class/class.module';

@Module({
  imports: [TypeOrmDatabaseModule, AiModule, ClassModule],
  controllers: [SubjectExamController, ExamAttemptController, WeakTopicController],
  providers: [
    GenerateExamUseCase,
    ListExamsUseCase,
    GetExamUseCase,
    StartAttemptUseCase,
    SubmitAttemptUseCase,
    GetAttemptResultUseCase,
    ListMyAttemptsUseCase,
    CreateOfficialExamUseCase,
    UpdateOfficialExamUseCase,
    GetMyWeakTopicsUseCase,
  ],
})
export class ExamModule {}
