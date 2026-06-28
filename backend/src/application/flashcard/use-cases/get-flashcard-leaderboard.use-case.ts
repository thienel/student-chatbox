import { Injectable, Inject } from '@nestjs/common';
import { IFlashcardRepository } from '../../../domain/flashcard/repositories/flashcard.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { User } from '../../../domain/user/entities/user.entity';

@Injectable()
export class GetFlashcardLeaderboardUseCase {
  constructor(
    @Inject(TOKENS.FLASHCARD_REPO) private readonly flashcardRepo: IFlashcardRepository,
  ) {}

  async execute(user: User, subjectId?: string) {
    return this.flashcardRepo.getLeaderboard(user.id, subjectId);
  }
}
