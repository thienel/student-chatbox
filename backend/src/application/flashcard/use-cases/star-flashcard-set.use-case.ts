import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { IFlashcardRepository } from '../../../domain/flashcard/repositories/flashcard.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { User } from '../../../domain/user/entities/user.entity';

@Injectable()
export class StarFlashcardSetUseCase {
  constructor(
    @Inject(TOKENS.FLASHCARD_REPO) private readonly flashcardRepo: IFlashcardRepository,
  ) {}

  async execute(setId: string, user: User): Promise<{ starCount: number }> {
    const set = await this.flashcardRepo.findSetById(setId);
    if (!set || !set.isPublic) throw new NotFoundException('Flashcard set not found');

    const { added, starCount } = await this.flashcardRepo.addStar(setId, user.id);
    if (!added) throw new ConflictException('You have already starred this set');
    return { starCount };
  }
}
