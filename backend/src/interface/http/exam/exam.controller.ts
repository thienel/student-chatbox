import {
  Controller, Post, Get, Body, Param,
  UseGuards, UsePipes, ValidationPipe,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionGuard } from '../../guards/permission.guard';
import { AiRateLimitGuard } from '../../guards/ai-rate-limit.guard';
import { RequirePermission } from '../../decorators/require-permission.decorator';
import { AiFeature } from '../../decorators/ai-feature.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { GenerateExamUseCase } from '../../../application/exam/use-cases/generate-exam.use-case';
import { ListExamsUseCase } from '../../../application/exam/use-cases/list-exams.use-case';
import { GetExamUseCase } from '../../../application/exam/use-cases/get-exam.use-case';
import { StartAttemptUseCase } from '../../../application/exam/use-cases/start-attempt.use-case';
import { SubmitAttemptUseCase } from '../../../application/exam/use-cases/submit-attempt.use-case';
import { GetAttemptResultUseCase } from '../../../application/exam/use-cases/get-attempt-result.use-case';
import { ListMyAttemptsUseCase } from '../../../application/exam/use-cases/list-my-attempts.use-case';
import { GenerateExamDto, SubmitAttemptDto } from '../../../application/exam/dtos/exam.dto';
import { User } from '../../../domain/user/entities/user.entity';

@Controller('subjects/:subjectId/exams')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class SubjectExamController {
  constructor(
    private readonly generateExamUseCase: GenerateExamUseCase,
    private readonly listExamsUseCase: ListExamsUseCase,
    private readonly getExamUseCase: GetExamUseCase,
    private readonly startAttemptUseCase: StartAttemptUseCase,
    private readonly submitAttemptUseCase: SubmitAttemptUseCase,
  ) {}

  @Get()
  @RequirePermission('exam:read')
  async list(@Param('subjectId') subjectId: string, @CurrentUser() user: User) {
    return this.listExamsUseCase.execute(subjectId, user);
  }

  @Post('generate')
  @RequirePermission('ai:generate-exam')
  @AiFeature('generate_exam')
  @UseGuards(AiRateLimitGuard)
  @HttpCode(HttpStatus.CREATED)
  async generate(
    @Param('subjectId') subjectId: string,
    @Body() dto: GenerateExamDto,
    @CurrentUser() user: User,
  ) {
    return this.generateExamUseCase.execute(subjectId, dto, user);
  }

  @Get(':examId')
  @RequirePermission('exam:read')
  async getExam(@Param('examId') examId: string) {
    return this.getExamUseCase.execute(examId);
  }

  @Post(':examId/attempts')
  @RequirePermission('exam:take')
  @HttpCode(HttpStatus.CREATED)
  async startAttempt(@Param('examId') examId: string, @CurrentUser() user: User) {
    return this.startAttemptUseCase.execute(examId, user);
  }

  @Post(':examId/attempts/:attemptId')
  @RequirePermission('exam:take')
  async submitAttempt(
    @Param('examId') examId: string,
    @Param('attemptId') attemptId: string,
    @Body() dto: SubmitAttemptDto,
    @CurrentUser() user: User,
  ) {
    return this.submitAttemptUseCase.execute(examId, attemptId, dto, user);
  }
}

@Controller('exam-attempts')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class ExamAttemptController {
  constructor(
    private readonly listMyAttemptsUseCase: ListMyAttemptsUseCase,
    private readonly getAttemptResultUseCase: GetAttemptResultUseCase,
  ) {}

  @Get()
  @RequirePermission('exam:take')
  async listMyAttempts(@CurrentUser() user: User) {
    return this.listMyAttemptsUseCase.execute(user);
  }

  @Get(':id')
  @RequirePermission('exam:take')
  async getResult(@Param('id') id: string, @CurrentUser() user: User) {
    return this.getAttemptResultUseCase.execute(id, user);
  }
}
