import { Injectable, Inject } from '@nestjs/common';
import { IBookmarkRepository } from '../../../domain/bookmark/repositories/bookmark.repository.interface';
import { BookmarkResourceType } from '../../../domain/bookmark/entities/bookmark.entity';
import { TOKENS } from '../../../shared/constants/tokens';
import { User } from '../../../domain/user/entities/user.entity';

@Injectable()
export class ListBookmarksUseCase {
  constructor(
    @Inject(TOKENS.BOOKMARK_REPO) private readonly bookmarkRepo: IBookmarkRepository,
  ) {}

  async execute(user: User, resourceType?: string) {
    return this.bookmarkRepo.findByUserId(user.id, resourceType as BookmarkResourceType | undefined);
  }
}
