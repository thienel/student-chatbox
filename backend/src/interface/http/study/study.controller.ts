import {
  Controller, Get, Post, Patch, Param, Body, Query,
  UseGuards, UsePipes, ValidationPipe, HttpCode, HttpStatus, ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionGuard } from '../../guards/permission.guard';
import { RequirePermission } from '../../decorators/require-permission.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { GetStudyQueueUseCase } from '../../../application/study/use-cases/get-study-queue.use-case';
import { StartStudySessionUseCase } from '../../../application/study/use-cases/start-study-session.use-case';
import { ReviewCardUseCase } from '../../../application/study/use-cases/review-card.use-case';
import { GetStudySessionUseCase } from '../../../application/study/use-cases/get-study-session.use-case';
import { GetStudySettingsUseCase } from '../../../application/study/use-cases/get-study-settings.use-case';
import { UpdateStudySettingsUseCase } from '../../../application/study/use-cases/update-study-settings.use-case';
import { GetStudyStatsUseCase } from '../../../application/study/use-cases/get-study-stats.use-case';
import { GetCurrentStudyPlanUseCase } from '../../../application/study/use-cases/get-current-study-plan.use-case';
import { GetStudyPlanHistoryUseCase } from '../../../application/study/use-cases/get-study-plan-history.use-case';
import { ReviewCardDto, UpdateStudySettingsDto } from '../../../application/study/dtos/study.dto';
import { User } from '../../../domain/user/entities/user.entity';

@Controller()
@UseGuards(JwtAuthGuard, PermissionGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class StudyController {
  constructor(
    private readonly getStudyQueueUseCase: GetStudyQueueUseCase,
    private readonly startStudySessionUseCase: StartStudySessionUseCase,
    private readonly reviewCardUseCase: ReviewCardUseCase,
    private readonly getStudySessionUseCase: GetStudySessionUseCase,
    private readonly getStudySettingsUseCase: GetStudySettingsUseCase,
    private readonly updateStudySettingsUseCase: UpdateStudySettingsUseCase,
    private readonly getStudyStatsUseCase: GetStudyStatsUseCase,
    private readonly getCurrentStudyPlanUseCase: GetCurrentStudyPlanUseCase,
    private readonly getStudyPlanHistoryUseCase: GetStudyPlanHistoryUseCase,
  ) {}

  @Get('flashcard-sets/:setId/study-queue')
  @RequirePermission('flashcard:study')
  async queue(@Param('setId') setId: string, @CurrentUser() user: User) {
    return this.getStudyQueueUseCase.execute(setId, user);
  }

  @Post('flashcard-sets/:setId/study-sessions')
  @RequirePermission('flashcard:study')
  @HttpCode(HttpStatus.CREATED)
  async start(@Param('setId') setId: string, @CurrentUser() user: User) {
    return this.startStudySessionUseCase.execute(setId, user);
  }

  @Post('study-sessions/:sessionId/reviews')
  @RequirePermission('flashcard:study')
  async review(
    @Param('sessionId') sessionId: string,
    @Body() dto: ReviewCardDto,
    @CurrentUser() user: User,
  ) {
    return this.reviewCardUseCase.execute(sessionId, dto, user);
  }

  @Get('study-sessions/:sessionId')
  @RequirePermission('flashcard:study')
  async getSession(@Param('sessionId') sessionId: string, @CurrentUser() user: User) {
    return this.getStudySessionUseCase.execute(sessionId, user);
  }

  @Get('study-settings')
  @RequirePermission('flashcard:study')
  async getSettings(@CurrentUser() user: User) {
    return this.getStudySettingsUseCase.execute(user);
  }

  @Patch('study-settings')
  @RequirePermission('flashcard:study')
  async updateSettings(@Body() dto: UpdateStudySettingsDto, @CurrentUser() user: User) {
    return this.updateStudySettingsUseCase.execute(user, dto);
  }

  @Get('study-stats')
  @RequirePermission('flashcard:study')
  async stats(@CurrentUser() user: User) {
    return this.getStudyStatsUseCase.execute(user);
  }

  @Get('study-plan/current')
  @RequirePermission('flashcard:study')
  async currentPlan(@CurrentUser() user: User) {
    return this.getCurrentStudyPlanUseCase.execute(user);
  }

  @Get('study-plan/history')
  @RequirePermission('flashcard:study')
  async planHistory(
    @CurrentUser() user: User,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.getStudyPlanHistoryUseCase.execute(user, limit);
  }
}
