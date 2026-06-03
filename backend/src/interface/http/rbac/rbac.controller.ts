import {
  Controller, Get, Post, Put, Body, Param,
  UseGuards, UsePipes, ValidationPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionGuard } from '../../guards/permission.guard';
import { RequirePermission } from '../../decorators/require-permission.decorator';
import { CreateRoleUseCase } from '../../../application/rbac/use-cases/create-role.use-case';
import { UpdateRolePermissionsUseCase } from '../../../application/rbac/use-cases/update-role-permissions.use-case';
import { CreateRoleDto, UpdateRolePermissionsDto } from '../../../application/rbac/dtos/rbac.dto';
import { Inject } from '@nestjs/common';
import { IRoleRepository } from '../../../domain/user/repositories/role.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';

@Controller('rbac')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class RbacController {
  constructor(
    private readonly createRoleUseCase: CreateRoleUseCase,
    private readonly updateRolePermissionsUseCase: UpdateRolePermissionsUseCase,
    @Inject(TOKENS.ROLE_REPO) private readonly roleRepo: IRoleRepository,
  ) {}

  @Get('roles')
  @RequirePermission('rbac:manage')
  async listRoles() {
    return this.roleRepo.findAll();
  }

  @Post('roles')
  @RequirePermission('rbac:manage')
  @HttpCode(HttpStatus.CREATED)
  async createRole(@Body() dto: CreateRoleDto) {
    return this.createRoleUseCase.execute(dto);
  }

  @Get('permissions')
  @RequirePermission('rbac:manage')
  async listPermissions() {
    return this.roleRepo.findAllPermissions();
  }

  @Put('roles/:id/permissions')
  @RequirePermission('rbac:manage')
  async updatePermissions(
    @Param('id') id: string,
    @Body() dto: UpdateRolePermissionsDto,
  ) {
    return this.updateRolePermissionsUseCase.execute(id, dto);
  }
}
