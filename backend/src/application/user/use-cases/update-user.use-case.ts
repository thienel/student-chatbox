import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IUserRepository } from '../../../domain/user/repositories/user.repository.interface';
import { IRoleRepository } from '../../../domain/user/repositories/role.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { User } from '../../../domain/user/entities/user.entity';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(TOKENS.USER_REPO) private readonly userRepo: IUserRepository,
    @Inject(TOKENS.ROLE_REPO) private readonly roleRepo: IRoleRepository,
  ) {}

  async execute(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updateData: Partial<User> = {};
    if (dto.fullName) updateData.fullName = dto.fullName;
    if (dto.role) {
      const role = await this.roleRepo.findByName(dto.role);
      if (!role) throw new BadRequestException(`Role '${dto.role}' not found`);
      updateData.roleId = role.id;
    }

    return this.userRepo.update(id, updateData);
  }
}
