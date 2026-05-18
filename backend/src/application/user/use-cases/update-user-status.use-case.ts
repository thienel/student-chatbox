import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IUserRepository } from '../../../domain/user/repositories/user.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { UpdateUserStatusDto } from '../dtos/update-user.dto';
import { User, UserStatus } from '../../../domain/user/entities/user.entity';

@Injectable()
export class UpdateUserStatusUseCase {
  constructor(
    @Inject(TOKENS.USER_REPO) private readonly userRepo: IUserRepository,
  ) {}

  async execute(id: string, dto: UpdateUserStatusDto): Promise<User> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.userRepo.update(id, { status: dto.status as UserStatus });
  }
}
