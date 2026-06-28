import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IFlashcardRepository } from '../../../domain/flashcard/repositories/flashcard.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { User } from '../../../domain/user/entities/user.entity';

@Injectable()
export class GetFlashcardSetUseCase {
  constructor(
    @Inject(TOKENS.FLASHCARD_REPO) private readonly flashcardRepo: IFlashcardRepository,
  ) {}

  async execute(setId: string, user: User) {
    const set = await this.flashcardRepo.findSetById(setId);
    if (!set) throw new NotFoundException('Flashcard set not found');
    // The creator can always see their set; everyone else only public sets.
    if (set.createdBy !== user.id && !set.isPublic) {
      throw new ForbiddenException('You do not have access to this set');
    }
    const cards = await this.flashcardRepo.findCardsBySetId(setId);
    return { set, cards };
  }
}
