import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
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
  ) {}

  @Get()
  @RequirePermission('flashcard:read')
  async list(@Param('subjectId') subjectId: string) {
    return this.listFlashcardSetsUseCase.execute(subjectId);
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
    return this.generateFlashcardsUseCase.execute(subjectId, dto, user);
  }

  @Get(':id')
  @RequirePermission('flashcard:read')
  async getSet(@Param('id') id: string) {
    return this.getFlashcardSetUseCase.execute(id);
  }

  @Delete(':id')
  @RequirePermission('flashcard:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSet(@Param('id') id: string, @CurrentUser() user: User): Promise<void> {
    await this.deleteFlashcardSetUseCase.execute(id, user);
  }
}
