import {
  Controller, Post, Get, Delete, Body, Param, Query,
  UseGuards, UsePipes, ValidationPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionGuard } from '../../guards/permission.guard';
import { RequirePermission } from '../../decorators/require-permission.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { AddBookmarkUseCase } from '../../../application/bookmark/use-cases/add-bookmark.use-case';
import { ListBookmarksUseCase } from '../../../application/bookmark/use-cases/list-bookmarks.use-case';
import { DeleteBookmarkUseCase } from '../../../application/bookmark/use-cases/delete-bookmark.use-case';
import { AddBookmarkDto } from '../../../application/bookmark/dtos/bookmark.dto';
import { User } from '../../../domain/user/entities/user.entity';

@Controller('bookmarks')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class BookmarkController {
  constructor(
    private readonly addBookmarkUseCase: AddBookmarkUseCase,
    private readonly listBookmarksUseCase: ListBookmarksUseCase,
    private readonly deleteBookmarkUseCase: DeleteBookmarkUseCase,
  ) {}

  @Get()
  @RequirePermission('bookmark:manage')
  async list(@CurrentUser() user: User, @Query('resourceType') resourceType?: string) {
    return this.listBookmarksUseCase.execute(user, resourceType);
  }

  @Post()
  @RequirePermission('bookmark:manage')
  @HttpCode(HttpStatus.CREATED)
  async add(@Body() dto: AddBookmarkDto, @CurrentUser() user: User) {
    return this.addBookmarkUseCase.execute(dto, user);
  }

  @Delete(':id')
  @RequirePermission('bookmark:manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser() user: User): Promise<void> {
    await this.deleteBookmarkUseCase.execute(id, user);
  }
}
