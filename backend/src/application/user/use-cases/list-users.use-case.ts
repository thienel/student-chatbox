import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository } from '../../../domain/user/repositories/user.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { ListUsersDto } from '../dtos/list-users.dto';
import { User, UserStatus } from '../../../domain/user/entities/user.entity';

@Injectable()
export class ListUsersUseCase {
  constructor(
    @Inject(TOKENS.USER_REPO) private readonly userRepo: IUserRepository,
  ) {}

  async execute(dto: ListUsersDto): Promise<{ items: User[]; total: number }> {
    return this.userRepo.findAll({
      role: dto.role,
      status: dto.status as UserStatus | undefined,
      search: dto.search,
      page: dto.page ?? 1,
      limit: dto.limit ?? 20,
    });
  }
}
