import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IFlashcardRepository } from '../../../domain/flashcard/repositories/flashcard.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';

@Injectable()
export class GetFlashcardSetUseCase {
  constructor(
    @Inject(TOKENS.FLASHCARD_REPO) private readonly flashcardRepo: IFlashcardRepository,
  ) {}

  async execute(setId: string) {
    const set = await this.flashcardRepo.findSetById(setId);
    if (!set) throw new NotFoundException('Flashcard set not found');
    const cards = await this.flashcardRepo.findCardsBySetId(setId);
    return { set, cards };
  }
}
