import { Injectable, Inject } from '@nestjs/common';
import { IFlashcardRepository } from '../../../domain/flashcard/repositories/flashcard.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { User } from '../../../domain/user/entities/user.entity';

@Injectable()
export class ListFlashcardSetsUseCase {
  constructor(
    @Inject(TOKENS.FLASHCARD_REPO) private readonly flashcardRepo: IFlashcardRepository,
  ) {}

  async execute(classId: string, user: User) {
    // Flashcard sets are private to the student who generated them.
    const sets = await this.flashcardRepo.findSetsByClassId(classId);
    return sets.filter((s) => s.createdBy === user.id);
  }
}
