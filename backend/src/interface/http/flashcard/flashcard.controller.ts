import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionGuard } from '../../guards/permission.guard';
import { AiRateLimitGuard } from '../../guards/ai-rate-limit.guard';
import { RequirePermission } from '../../decorators/require-permission.decorator';
import { AiFeature } from '../../decorators/ai-feature.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { GenerateFlashcardsUseCase } from '../../../application/flashcard/use-cases/generate-flashcards.use-case';
import { ListFlashcardSetsUseCase } from '../../../application/flashcard/use-cases/list-flashcard-sets.use-case';
import { GetFlashcardSetUseCase } from '../../../application/flashcard/use-cases/get-flashcard-set.use-case';
import { DeleteFlashcardSetUseCase } from '../../../application/flashcard/use-cases/delete-flashcard-set.use-case';
import { GenerateFlashcardsDto } from '../../../application/flashcard/dtos/flashcard.dto';
import { ClassContextService } from '../../../application/class/services/class-context.service';
import { User } from '../../../domain/user/entities/user.entity';

@Controller('subjects/:subjectId/flashcard-sets')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class FlashcardController {
  constructor(
    private readonly generateFlashcardsUseCase: GenerateFlashcardsUseCase,
    private readonly listFlashcardSetsUseCase: ListFlashcardSetsUseCase,
    private readonly getFlashcardSetUseCase: GetFlashcardSetUseCase,
    private readonly deleteFlashcardSetUseCase: DeleteFlashcardSetUseCase,
    private readonly classContext: ClassContextService,
  ) {}

  @Get()
  @RequirePermission('flashcard:read')
  async list(
    @Param('subjectId') subjectId: string,
    @Query('classId') classId: string,
    @CurrentUser() user: User,
  ) {
    const resolvedClassId = await this.classContext.resolveClassId(subjectId, user, classId);
    return this.listFlashcardSetsUseCase.execute(resolvedClassId, user);
  }

  @Post('generate')
  @RequirePermission('ai:generate-flashcard')
  @AiFeature('generate_flashcard')
  @UseGuards(AiRateLimitGuard)
  @HttpCode(HttpStatus.CREATED)
  async generate(
    @Param('subjectId') subjectId: string,
    @Body() dto: GenerateFlashcardsDto,
    @CurrentUser() user: User,
  ) {
    const resolvedClassId = await this.classContext.resolveClassId(subjectId, user, dto.classId);
    return this.generateFlashcardsUseCase.execute(subjectId, resolvedClassId, dto, user);
  }

  @Get(':id')
  @RequirePermission('flashcard:read')
  async getSet(@Param('id') id: string, @CurrentUser() user: User) {
    return this.getFlashcardSetUseCase.execute(id, user);
  }

  @Delete(':id')
  @RequirePermission('flashcard:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSet(@Param('id') id: string, @CurrentUser() user: User): Promise<void> {
    await this.deleteFlashcardSetUseCase.execute(id, user);
  }
}
