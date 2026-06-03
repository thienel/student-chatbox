import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { IRoleRepository } from '../../../domain/user/repositories/role.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { CreateRoleDto } from '../dtos/rbac.dto';

@Injectable()
export class CreateRoleUseCase {
  constructor(
    @Inject(TOKENS.ROLE_REPO) private readonly roleRepo: IRoleRepository,
  ) {}

  async execute(dto: CreateRoleDto) {
    const existing = await this.roleRepo.findByName(dto.name);
    if (existing) throw new ConflictException(`Role "${dto.name}" already exists`);
    return this.roleRepo.create(dto.name, dto.description);
  }
}
