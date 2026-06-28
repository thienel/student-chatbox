import {
  Controller, Get, Param, UseGuards, UsePipes, ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionGuard } from '../../guards/permission.guard';
import { RequirePermission } from '../../decorators/require-permission.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { GetMyWeakTopicsUseCase } from '../../../application/exam/use-cases/get-my-weak-topics.use-case';
import { User } from '../../../domain/user/entities/user.entity';

@Controller('subjects/:subjectId')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class WeakTopicController {
  constructor(
    private readonly getMyWeakTopicsUseCase: GetMyWeakTopicsUseCase,
  ) {}

  @Get('my-weak-topics')
  @RequirePermission('exam:take')
  async myWeakTopics(@Param('subjectId') subjectId: string, @CurrentUser() user: User) {
    return this.getMyWeakTopicsUseCase.execute(subjectId, user);
  }
}
