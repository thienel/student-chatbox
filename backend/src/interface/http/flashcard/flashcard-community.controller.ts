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
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

@Controller('flashcard-sets')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@ApiTags('Flashcard Community')
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
    @ApiOperation({ summary: 'Discover' })
  async discover(
    @CurrentUser() user: User,
    @Query('subjectId') subjectId?: string,
    @Query('sort') sort?: 'stars' | 'newest',
    @Query('page') pageStr?: string,
  ) {
    const page = pageStr ? parseInt(pageStr, 10) : undefined;
    return this.discoverUseCase.execute(user, { subjectId, sort, page: isNaN(page as any) ? undefined : page });
  }

  @Get('leaderboard')
  @RequirePermission('flashcard:read')
    @ApiOperation({ summary: 'Leaderboard' })
  async leaderboard(
    @CurrentUser() user: User,
    @Query('subjectId') subjectId?: string,
  ) {
    return this.leaderboardUseCase.execute(user, subjectId);
  }

  @Patch(':id/visibility')
  @RequirePermission('flashcard:manage-own')
    @ApiOperation({ summary: 'Set visibility' })
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
    @ApiOperation({ summary: 'Star' })
  async star(@Param('id') id: string, @CurrentUser() user: User) {
    return this.starUseCase.execute(id, user);
  }

  @Delete(':id/stars')
  @RequirePermission('flashcard:read')
    @ApiOperation({ summary: 'Unstar' })
  async unstar(@Param('id') id: string, @CurrentUser() user: User) {
    return this.unstarUseCase.execute(id, user);
  }

  @Post(':id/clone')
  @RequirePermission('flashcard:manage-own')
  @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Clone' })
  async clone(@Param('id') id: string, @CurrentUser() user: User) {
    return this.cloneUseCase.execute(id, user);
  }
}
