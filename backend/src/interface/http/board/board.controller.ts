import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query,
  UseGuards, UsePipes, ValidationPipe, HttpCode, HttpStatus, ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionGuard } from '../../guards/permission.guard';
import { RequirePermission } from '../../decorators/require-permission.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { BoardService } from '../../../application/board/board.service';
import {
  CreateQuestionDto, UpdateQuestionDto, CreateAnswerDto, UpdateAnswerDto,
} from '../../../application/board/dtos/board.dto';
import { User } from '../../../domain/user/entities/user.entity';
import { BoardQuestionStatus } from '../../../domain/board/board.repository.interface';

@Controller('subjects/:subjectId/classes/:classId/board')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class BoardController {
  constructor(private readonly board: BoardService) {}

  @Get('questions')
  @RequirePermission('subject:read')
  listQuestions(
    @Param('subjectId') subjectId: string,
    @Param('classId') classId: string,
    @CurrentUser() user: User,
    @Query('status') status?: BoardQuestionStatus,
    @Query('sort') sort?: 'upvotes' | 'newest',
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
  ) {
    return this.board.listQuestions(subjectId, classId, user, { status, sort, page });
  }

  @Post('questions')
  @RequirePermission('subject:read')
  @HttpCode(HttpStatus.CREATED)
  createQuestion(
    @Param('subjectId') subjectId: string,
    @Param('classId') classId: string,
    @Body() dto: CreateQuestionDto,
    @CurrentUser() user: User,
  ) {
    return this.board.createQuestion(subjectId, classId, user, dto);
  }

  @Patch('questions/:questionId')
  @RequirePermission('subject:read')
  updateQuestion(
    @Param('subjectId') subjectId: string,
    @Param('classId') classId: string,
    @Param('questionId') questionId: string,
    @Body() dto: UpdateQuestionDto,
    @CurrentUser() user: User,
  ) {
    return this.board.updateQuestion(subjectId, classId, questionId, user, dto);
  }

  @Delete('questions/:questionId')
  @RequirePermission('subject:read')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteQuestion(
    @Param('subjectId') subjectId: string,
    @Param('classId') classId: string,
    @Param('questionId') questionId: string,
    @CurrentUser() user: User,
  ) {
    await this.board.deleteQuestion(subjectId, classId, questionId, user);
  }

  @Patch('questions/:questionId/close')
  @RequirePermission('class:manage')
  closeQuestion(
    @Param('subjectId') subjectId: string,
    @Param('classId') classId: string,
    @Param('questionId') questionId: string,
    @CurrentUser() user: User,
  ) {
    return this.board.closeQuestion(subjectId, classId, questionId, user);
  }

  @Post('questions/:questionId/upvote')
  @RequirePermission('subject:read')
  upvoteQuestion(
    @Param('subjectId') subjectId: string,
    @Param('classId') classId: string,
    @Param('questionId') questionId: string,
    @CurrentUser() user: User,
  ) {
    return this.board.upvoteQuestion(subjectId, classId, questionId, user);
  }

  @Get('questions/:questionId/answers')
  @RequirePermission('subject:read')
  listAnswers(
    @Param('subjectId') subjectId: string,
    @Param('classId') classId: string,
    @Param('questionId') questionId: string,
    @CurrentUser() user: User,
  ) {
    return this.board.listAnswers(subjectId, classId, questionId, user);
  }

  @Post('questions/:questionId/answers')
  @RequirePermission('subject:read')
  @HttpCode(HttpStatus.CREATED)
  createAnswer(
    @Param('subjectId') subjectId: string,
    @Param('classId') classId: string,
    @Param('questionId') questionId: string,
    @Body() dto: CreateAnswerDto,
    @CurrentUser() user: User,
  ) {
    return this.board.createAnswer(subjectId, classId, questionId, user, dto);
  }

  @Patch('questions/:questionId/answers/:answerId')
  @RequirePermission('subject:read')
  updateAnswer(
    @Param('subjectId') subjectId: string,
    @Param('classId') classId: string,
    @Param('questionId') questionId: string,
    @Param('answerId') answerId: string,
    @Body() dto: UpdateAnswerDto,
    @CurrentUser() user: User,
  ) {
    return this.board.updateAnswer(subjectId, classId, questionId, answerId, user, dto);
  }

  @Delete('questions/:questionId/answers/:answerId')
  @RequirePermission('subject:read')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAnswer(
    @Param('subjectId') subjectId: string,
    @Param('classId') classId: string,
    @Param('questionId') questionId: string,
    @Param('answerId') answerId: string,
    @CurrentUser() user: User,
  ) {
    await this.board.deleteAnswer(subjectId, classId, questionId, answerId, user);
  }

  @Post('questions/:questionId/answers/:answerId/pin')
  @RequirePermission('class:manage')
  pinAnswer(
    @Param('subjectId') subjectId: string,
    @Param('classId') classId: string,
    @Param('questionId') questionId: string,
    @Param('answerId') answerId: string,
    @CurrentUser() user: User,
  ) {
    return this.board.pinAnswer(subjectId, classId, questionId, answerId, user);
  }

  @Post('questions/:questionId/answers/:answerId/upvote')
  @RequirePermission('subject:read')
  upvoteAnswer(
    @Param('subjectId') subjectId: string,
    @Param('classId') classId: string,
    @Param('questionId') questionId: string,
    @Param('answerId') answerId: string,
    @CurrentUser() user: User,
  ) {
    return this.board.upvoteAnswer(subjectId, classId, questionId, answerId, user);
  }
}
