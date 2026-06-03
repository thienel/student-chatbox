import { Injectable, Inject } from '@nestjs/common';
import { IBookmarkRepository } from '../../../domain/bookmark/repositories/bookmark.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { User } from '../../../domain/user/entities/user.entity';
import { AddBookmarkDto } from '../dtos/bookmark.dto';

@Injectable()
export class AddBookmarkUseCase {
  constructor(
    @Inject(TOKENS.BOOKMARK_REPO) private readonly bookmarkRepo: IBookmarkRepository,
  ) {}

  async execute(dto: AddBookmarkDto, user: User) {
    return this.bookmarkRepo.create({
      userId: user.id,
      resourceType: dto.resourceType,
      resourceId: dto.resourceId,
      note: dto.note,
    });
  }
}
