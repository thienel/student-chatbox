import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionGuard } from '../../guards/permission.guard';
import { RequirePermission } from '../../decorators/require-permission.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { CreateUserUseCase } from '../../../application/user/use-cases/create-user.use-case';
import { ListUsersUseCase } from '../../../application/user/use-cases/list-users.use-case';
import { GetUserUseCase } from '../../../application/user/use-cases/get-user.use-case';
import { UpdateUserUseCase } from '../../../application/user/use-cases/update-user.use-case';
import { UpdateUserStatusUseCase } from '../../../application/user/use-cases/update-user-status.use-case';
import { ResetPasswordUseCase } from '../../../application/user/use-cases/reset-password.use-case';
import { CreateUserDto } from '../../../application/user/dtos/create-user.dto';
import { ListUsersDto } from '../../../application/user/dtos/list-users.dto';
import { UpdateUserDto, UpdateUserStatusDto, ResetPasswordDto } from '../../../application/user/dtos/update-user.dto';
import { AuditLogService } from '../../../application/system/services/audit-log.service';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly getUserUseCase: GetUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly updateUserStatusUseCase: UpdateUserStatusUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Post()
  @RequirePermission('user:create')
  @HttpCode(HttpStatus.CREATED)
  async createUser(
    @Body() dto: CreateUserDto,
    @CurrentUser() currentUser: any,
    @Req() req: Request,
  ) {
    const user = await this.createUserUseCase.execute(dto, currentUser.id);
    await this.auditLogService.log(
      currentUser.id,
      'USER_CREATED',
      'user',
      user.id,
      { email: user.email, role: dto.role },
      req.ip,
    );
    return user;
  }

  @Get()
  @RequirePermission('user:read-list')
  async listUsers(@Query() dto: ListUsersDto) {
    return this.listUsersUseCase.execute(dto);
  }

  @Get(':id')
  @RequirePermission('user:read-list')
  async getUser(@Param('id') id: string) {
    return this.getUserUseCase.execute(id);
  }

  @Patch(':id')
  @RequirePermission('user:update')
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.updateUserUseCase.execute(id, dto);
  }

  @Patch(':id/status')
  @RequirePermission('user:suspend')
  async updateUserStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() currentUser: any,
    @Req() req: Request,
  ) {
    const user = await this.updateUserStatusUseCase.execute(id, dto);
    const action = dto.status === 'suspended' ? 'USER_SUSPENDED' : 'USER_ACTIVATED';
    await this.auditLogService.log(currentUser.id, action, 'user', id, { reason: dto.reason }, req.ip);
    return user;
  }

  @Post(':id/reset-password')
  @RequirePermission('user:update')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Param('id') id: string, @Body() dto: ResetPasswordDto) {
    await this.resetPasswordUseCase.execute(id, dto);
    return { message: 'Password reset successfully' };
  }
}
