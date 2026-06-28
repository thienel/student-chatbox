import {
  Controller, Get, Post, Delete, Patch, Param, Query, Body,
  UseGuards, UsePipes, ValidationPipe, HttpCode, HttpStatus, ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionGuard } from '../../guards/permission.guard';
import { RequirePermission } from '../../decorators/require-permission.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { DiscoverFlashcardSetsUseCase } from '../../../application/flashcard/use-cases/discover-flashcard-sets.use-case';
import { GetFlashcardLeaderboardUseCase } from '../../../application/flashcard/use-cases/get-flashcard-leaderboard.use-case';
import { SetFlashcardVisibilityUseCase } from '../../../application/flashcard/use-cases/set-flashcard-visibility.use-case';
import { StarFlashcardSetUseCase } from '../../../application/flashcard/use-cases/star-flashcard-set.use-case';
import { UnstarFlashcardSetUseCase } from '../../../application/flashcard/use-cases/unstar-flashcard-set.use-case';
import { CloneFlashcardSetUseCase } from '../../../application/flashcard/use-cases/clone-flashcard-set.use-case';
import { SetVisibilityDto } from '../../../application/flashcard/dtos/flashcard.dto';
import { User } from '../../../domain/user/entities/user.entity';

@Controller('flashcard-sets')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class FlashcardCommunityController {
  constructor(
    private readonly discoverUseCase: DiscoverFlashcardSetsUseCase,
    private readonly leaderboardUseCase: GetFlashcardLeaderboardUseCase,
    private readonly setVisibilityUseCase: SetFlashcardVisibilityUseCase,
    private readonly starUseCase: StarFlashcardSetUseCase,
    private readonly unstarUseCase: UnstarFlashcardSetUseCase,
    private readonly cloneUseCase: CloneFlashcardSetUseCase,
  ) {}

  @Get('discover')
  @RequirePermission('flashcard:read')
  async discover(
    @CurrentUser() user: User,
    @Query('subjectId') subjectId?: string,
    @Query('sort') sort?: 'stars' | 'newest',
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
  ) {
    return this.discoverUseCase.execute(user, { subjectId, sort, page });
  }

  @Get('leaderboard')
  @RequirePermission('flashcard:read')
  async leaderboard(
    @CurrentUser() user: User,
    @Query('subjectId') subjectId?: string,
  ) {
    return this.leaderboardUseCase.execute(user, subjectId);
  }

  @Patch(':id/visibility')
  @RequirePermission('flashcard:manage-own')
  async setVisibility(
    @Param('id') id: string,
    @Body() dto: SetVisibilityDto,
    @CurrentUser() user: User,
  ) {
    return this.setVisibilityUseCase.execute(id, dto.isPublic, user);
  }

  @Post(':id/stars')
  @RequirePermission('flashcard:read')
  @HttpCode(HttpStatus.CREATED)
  async star(@Param('id') id: string, @CurrentUser() user: User) {
    return this.starUseCase.execute(id, user);
  }

  @Delete(':id/stars')
  @RequirePermission('flashcard:read')
  async unstar(@Param('id') id: string, @CurrentUser() user: User) {
    return this.unstarUseCase.execute(id, user);
  }

  @Post(':id/clone')
  @RequirePermission('flashcard:manage-own')
  @HttpCode(HttpStatus.CREATED)
  async clone(@Param('id') id: string, @CurrentUser() user: User) {
    return this.cloneUseCase.execute(id, user);
  }
}
