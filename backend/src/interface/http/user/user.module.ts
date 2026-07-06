import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UserController } from './user.controller';
import { CreateUserUseCase } from '../../../application/user/use-cases/create-user.use-case';
import { ListUsersUseCase } from '../../../application/user/use-cases/list-users.use-case';
import { GetUserUseCase } from '../../../application/user/use-cases/get-user.use-case';
import { UpdateUserUseCase } from '../../../application/user/use-cases/update-user.use-case';
import { UpdateUserStatusUseCase } from '../../../application/user/use-cases/update-user-status.use-case';
import { ResetPasswordUseCase } from '../../../application/user/use-cases/reset-password.use-case';
import { TypeOrmDatabaseModule } from '../../../infrastructure/database/typeorm/typeorm.module';
import { AuditLogService } from '../../../application/system/services/audit-log.service';
import { StudentVerificationController } from './student-verification.controller';
import { AdminStudentVerificationController } from './admin-student-verification.controller';
import { AdminStudentEmailAllowlistController } from './admin-student-email-allowlist.controller';
import { StudentVerificationService } from '../../../application/user/services/student-verification.service';
import { BcryptPasswordService } from '../../../infrastructure/auth/services/bcrypt-password.service';
import { EmailModule } from '../../../infrastructure/email/email.module';
import { StudentEmailAllowlistService } from '../../../application/user/services/student-email-allowlist.service';

@Module({
  imports: [TypeOrmDatabaseModule, EmailModule, forwardRef(() => AuthModule)],
  controllers: [
    UserController, 
    StudentVerificationController, 
    AdminStudentVerificationController,
    AdminStudentEmailAllowlistController
  ],
  providers: [
    CreateUserUseCase,
    ListUsersUseCase,
    GetUserUseCase,
    UpdateUserUseCase,
    UpdateUserStatusUseCase,
    ResetPasswordUseCase,
    AuditLogService,
    StudentVerificationService,
    StudentEmailAllowlistService,
    {
      provide: 'IPasswordService',
      useClass: BcryptPasswordService,
    },
  ],
  exports: [StudentVerificationService, StudentEmailAllowlistService],
})
export class UserModule {}
