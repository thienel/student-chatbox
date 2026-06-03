import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IRoleRepository } from '../../../domain/user/repositories/role.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { UpdateRolePermissionsDto } from '../dtos/rbac.dto';

@Injectable()
export class UpdateRolePermissionsUseCase {
  constructor(
    @Inject(TOKENS.ROLE_REPO) private readonly roleRepo: IRoleRepository,
  ) {}

  async execute(roleId: string, dto: UpdateRolePermissionsDto) {
    const role = await this.roleRepo.findById(roleId);
    if (!role) throw new NotFoundException('Role not found');
    return this.roleRepo.updatePermissions(roleId, dto.permissionNames);
  }
}
