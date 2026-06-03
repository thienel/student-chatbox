import { Injectable, Inject } from '@nestjs/common';
import { IFlashcardRepository } from '../../../domain/flashcard/repositories/flashcard.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';

@Injectable()
export class ListFlashcardSetsUseCase {
  constructor(
    @Inject(TOKENS.FLASHCARD_REPO) private readonly flashcardRepo: IFlashcardRepository,
  ) {}

  async execute(subjectId: string) {
    return this.flashcardRepo.findSetsBySubjectId(subjectId);
  }
}
