import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { CreateUserUseCase } from '../../../application/user/use-cases/create-user.use-case';
import { ListUsersUseCase } from '../../../application/user/use-cases/list-users.use-case';
import { GetUserUseCase } from '../../../application/user/use-cases/get-user.use-case';
import { UpdateUserUseCase } from '../../../application/user/use-cases/update-user.use-case';
import { UpdateUserStatusUseCase } from '../../../application/user/use-cases/update-user-status.use-case';
import { ResetPasswordUseCase } from '../../../application/user/use-cases/reset-password.use-case';
import { TypeOrmDatabaseModule } from '../../../infrastructure/database/typeorm/typeorm.module';
import { AuditLogService } from '../../../application/system/services/audit-log.service';

@Module({
  imports: [TypeOrmDatabaseModule],
  controllers: [UserController],
  providers: [
    CreateUserUseCase,
    ListUsersUseCase,
    GetUserUseCase,
    UpdateUserUseCase,
    UpdateUserStatusUseCase,
    ResetPasswordUseCase,
    AuditLogService,
  ],
})
export class UserModule {}
