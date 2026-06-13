import { Module } from '@nestjs/common';
import { SubjectController } from './subject.controller';
import { CreateSubjectUseCase } from '../../../application/subject/use-cases/create-subject.use-case';
import { ListSubjectsUseCase } from '../../../application/subject/use-cases/list-subjects.use-case';
import { GetSubjectUseCase } from '../../../application/subject/use-cases/get-subject.use-case';
import { UpdateSubjectUseCase } from '../../../application/subject/use-cases/update-subject.use-case';
import { DeleteSubjectUseCase } from '../../../application/subject/use-cases/delete-subject.use-case';
import { AssignLecturerUseCase } from '../../../application/subject/use-cases/assign-lecturer.use-case';
import { RemoveLecturerUseCase } from '../../../application/subject/use-cases/remove-lecturer.use-case';
import { TypeOrmDatabaseModule } from '../../../infrastructure/database/typeorm/typeorm.module';
import { AuditLogService } from '../../../application/system/services/audit-log.service';

@Module({
  imports: [TypeOrmDatabaseModule],
  controllers: [SubjectController],
  providers: [
    CreateSubjectUseCase,
    ListSubjectsUseCase,
    GetSubjectUseCase,
    UpdateSubjectUseCase,
    DeleteSubjectUseCase,
    AssignLecturerUseCase,
    RemoveLecturerUseCase,
    AuditLogService,
  ],
})
export class SubjectModule {}
