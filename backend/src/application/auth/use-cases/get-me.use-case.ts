import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IUserRepository } from '../../../domain/user/repositories/user.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { User } from '../../../domain/user/entities/user.entity';

@Injectable()
export class GetMeUseCase {
  constructor(
    @Inject(TOKENS.USER_REPO) private readonly userRepo: IUserRepository,
  ) {}

  async execute(userId: string): Promise<User> {
    const user = await this.userRepo.findByIdWithPermissions(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
