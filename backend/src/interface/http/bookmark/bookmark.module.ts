import { Module } from '@nestjs/common';
import { BookmarkController } from './bookmark.controller';
import { AddBookmarkUseCase } from '../../../application/bookmark/use-cases/add-bookmark.use-case';
import { ListBookmarksUseCase } from '../../../application/bookmark/use-cases/list-bookmarks.use-case';
import { DeleteBookmarkUseCase } from '../../../application/bookmark/use-cases/delete-bookmark.use-case';
import { TypeOrmDatabaseModule } from '../../../infrastructure/database/typeorm/typeorm.module';

@Module({
  imports: [TypeOrmDatabaseModule],
  controllers: [BookmarkController],
  providers: [AddBookmarkUseCase, ListBookmarksUseCase, DeleteBookmarkUseCase],
})
export class BookmarkModule {}
