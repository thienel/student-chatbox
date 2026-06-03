import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IBookmarkRepository } from '../../../domain/bookmark/repositories/bookmark.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { User } from '../../../domain/user/entities/user.entity';

@Injectable()
export class DeleteBookmarkUseCase {
  constructor(
    @Inject(TOKENS.BOOKMARK_REPO) private readonly bookmarkRepo: IBookmarkRepository,
  ) {}

  async execute(id: string, user: User): Promise<void> {
    const bookmark = await this.bookmarkRepo.findById(id);
    if (!bookmark) throw new NotFoundException('Bookmark not found');
    if (bookmark.userId !== user.id && user.roleName !== 'admin') throw new ForbiddenException();
    await this.bookmarkRepo.delete(id);
  }
}
