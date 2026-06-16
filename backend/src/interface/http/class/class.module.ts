import { Module } from '@nestjs/common';
import { ClassController } from './class.controller';
import { CreateClassUseCase } from '../../../application/class/use-cases/create-class.use-case';
import { ListSubjectClassesUseCase } from '../../../application/class/use-cases/list-subject-classes.use-case';
import { ListSubjectLecturersUseCase } from '../../../application/class/use-cases/list-subject-lecturers.use-case';
import { EnrollByPasswordUseCase } from '../../../application/class/use-cases/enroll-by-password.use-case';
import { UnenrollClassUseCase } from '../../../application/class/use-cases/unenroll-class.use-case';
import { GetMyClassUseCase } from '../../../application/class/use-cases/get-my-class.use-case';
import { ListClassStudentsUseCase } from '../../../application/class/use-cases/list-class-students.use-case';
import { RemoveClassStudentUseCase } from '../../../application/class/use-cases/remove-class-student.use-case';
import { GetClassStatsUseCase } from '../../../application/class/use-cases/get-class-stats.use-case';
import { ClassContextService } from '../../../application/class/services/class-context.service';
import { TypeOrmDatabaseModule } from '../../../infrastructure/database/typeorm/typeorm.module';

@Module({
  imports: [TypeOrmDatabaseModule],
  controllers: [ClassController],
  providers: [
    CreateClassUseCase,
    ListSubjectClassesUseCase,
    ListSubjectLecturersUseCase,
    EnrollByPasswordUseCase,
    UnenrollClassUseCase,
    GetMyClassUseCase,
    ListClassStudentsUseCase,
    RemoveClassStudentUseCase,
    GetClassStatsUseCase,
    ClassContextService,
  ],
  exports: [ClassContextService],
})
export class ClassModule {}
