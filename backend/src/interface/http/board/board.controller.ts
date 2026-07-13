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
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

@Controller('subjects/:subjectId/classes/:classId/board')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@ApiTags('Board')
export class BoardController {
  constructor(private readonly board: BoardService) {}

  @Get('questions')
  @RequirePermission('subject:read')
    @ApiOperation({ summary: 'List questions' })
  listQuestions(
    @Param('subjectId') subjectId: string,
    @Param('classId') classId: string,
    @CurrentUser() user: User,
    @Query('status') status?: BoardQuestionStatus,
    @Query('sort') sort?: 'upvotes' | 'newest',
    @Query('page') pageStr?: string,
  ) {
    const page = pageStr ? parseInt(pageStr, 10) : undefined;
    return this.board.listQuestions(subjectId, classId, user, { status, sort, page });
  }

  @Post('questions')
  @RequirePermission('subject:read')
  @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create question' })
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
    @ApiOperation({ summary: 'Update question' })
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
    @ApiOperation({ summary: 'Delete question' })
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
    @ApiOperation({ summary: 'Close question' })
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
    @ApiOperation({ summary: 'Upvote question' })
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
    @ApiOperation({ summary: 'List answers' })
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
    @ApiOperation({ summary: 'Create answer' })
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
    @ApiOperation({ summary: 'Update answer' })
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
    @ApiOperation({ summary: 'Delete answer' })
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
    @ApiOperation({ summary: 'Pin answer' })
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
    @ApiOperation({ summary: 'Upvote answer' })
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
