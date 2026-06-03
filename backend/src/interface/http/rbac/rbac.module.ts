import { Module } from '@nestjs/common';
import { RbacController } from './rbac.controller';
import { CreateRoleUseCase } from '../../../application/rbac/use-cases/create-role.use-case';
import { UpdateRolePermissionsUseCase } from '../../../application/rbac/use-cases/update-role-permissions.use-case';
import { TypeOrmDatabaseModule } from '../../../infrastructure/database/typeorm/typeorm.module';

@Module({
  imports: [TypeOrmDatabaseModule],
  controllers: [RbacController],
  providers: [CreateRoleUseCase, UpdateRolePermissionsUseCase],
})
export class RbacModule {}
