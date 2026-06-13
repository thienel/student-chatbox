import { Module } from '@nestjs/common';
import { FlashcardController } from './flashcard.controller';
import { GenerateFlashcardsUseCase } from '../../../application/flashcard/use-cases/generate-flashcards.use-case';
import { ListFlashcardSetsUseCase } from '../../../application/flashcard/use-cases/list-flashcard-sets.use-case';
import { GetFlashcardSetUseCase } from '../../../application/flashcard/use-cases/get-flashcard-set.use-case';
import { DeleteFlashcardSetUseCase } from '../../../application/flashcard/use-cases/delete-flashcard-set.use-case';
import { TypeOrmDatabaseModule } from '../../../infrastructure/database/typeorm/typeorm.module';
import { AiModule } from '../../../infrastructure/ai/ai.module';
import { ClassModule } from '../class/class.module';

@Module({
  imports: [TypeOrmDatabaseModule, AiModule, ClassModule],
  controllers: [FlashcardController],
  providers: [
    GenerateFlashcardsUseCase,
    ListFlashcardSetsUseCase,
    GetFlashcardSetUseCase,
    DeleteFlashcardSetUseCase,
  ],
})
export class FlashcardModule {}
