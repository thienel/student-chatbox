import { Injectable, Inject, ConflictException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IUserRepository } from '../../../domain/user/repositories/user.repository.interface';
import { IRoleRepository } from '../../../domain/user/repositories/role.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { CreateUserDto } from '../dtos/create-user.dto';
import { User, UserStatus } from '../../../domain/user/entities/user.entity';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(TOKENS.USER_REPO) private readonly userRepo: IUserRepository,
    @Inject(TOKENS.ROLE_REPO) private readonly roleRepo: IRoleRepository,
  ) {}

  async execute(dto: CreateUserDto, createdBy: string): Promise<User> {
    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const role = await this.roleRepo.findByName(dto.role);
    if (!role) {
      throw new BadRequestException(`Role '${dto.role}' not found`);
    }

    const passwordHash = await bcrypt.hash(dto.temporaryPassword, 12);

    return this.userRepo.create({
      email: dto.email,
      fullName: dto.fullName,
      passwordHash,
      roleId: role.id,
      status: UserStatus.ACTIVE,
      createdBy,
    });
  }
}
