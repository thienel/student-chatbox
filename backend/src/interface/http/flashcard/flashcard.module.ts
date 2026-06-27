import { Module } from '@nestjs/common';
import { FlashcardController } from './flashcard.controller';
import { FlashcardCommunityController } from './flashcard-community.controller';
import { GenerateFlashcardsUseCase } from '../../../application/flashcard/use-cases/generate-flashcards.use-case';
import { ListFlashcardSetsUseCase } from '../../../application/flashcard/use-cases/list-flashcard-sets.use-case';
import { GetFlashcardSetUseCase } from '../../../application/flashcard/use-cases/get-flashcard-set.use-case';
import { DeleteFlashcardSetUseCase } from '../../../application/flashcard/use-cases/delete-flashcard-set.use-case';
import { DiscoverFlashcardSetsUseCase } from '../../../application/flashcard/use-cases/discover-flashcard-sets.use-case';
import { GetFlashcardLeaderboardUseCase } from '../../../application/flashcard/use-cases/get-flashcard-leaderboard.use-case';
import { SetFlashcardVisibilityUseCase } from '../../../application/flashcard/use-cases/set-flashcard-visibility.use-case';
import { StarFlashcardSetUseCase } from '../../../application/flashcard/use-cases/star-flashcard-set.use-case';
import { UnstarFlashcardSetUseCase } from '../../../application/flashcard/use-cases/unstar-flashcard-set.use-case';
import { CloneFlashcardSetUseCase } from '../../../application/flashcard/use-cases/clone-flashcard-set.use-case';
import { TypeOrmDatabaseModule } from '../../../infrastructure/database/typeorm/typeorm.module';
import { AiModule } from '../../../infrastructure/ai/ai.module';
import { ClassModule } from '../class/class.module';

@Module({
  imports: [TypeOrmDatabaseModule, AiModule, ClassModule],
  controllers: [FlashcardController, FlashcardCommunityController],
  providers: [
    GenerateFlashcardsUseCase,
    ListFlashcardSetsUseCase,
    GetFlashcardSetUseCase,
    DeleteFlashcardSetUseCase,
    DiscoverFlashcardSetsUseCase,
    GetFlashcardLeaderboardUseCase,
    SetFlashcardVisibilityUseCase,
    StarFlashcardSetUseCase,
    UnstarFlashcardSetUseCase,
    CloneFlashcardSetUseCase,
  ],
})
export class FlashcardModule {}
