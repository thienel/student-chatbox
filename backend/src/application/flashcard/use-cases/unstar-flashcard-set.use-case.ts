import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IFlashcardRepository } from '../../../domain/flashcard/repositories/flashcard.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { User } from '../../../domain/user/entities/user.entity';

@Injectable()
export class UnstarFlashcardSetUseCase {
  constructor(
    @Inject(TOKENS.FLASHCARD_REPO) private readonly flashcardRepo: IFlashcardRepository,
  ) {}

  async execute(setId: string, user: User): Promise<{ starCount: number }> {
    const { removed, starCount } = await this.flashcardRepo.removeStar(setId, user.id);
    if (!removed) throw new NotFoundException('You have not starred this set');
    return { starCount };
  }
}
