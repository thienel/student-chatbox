import { Injectable, Inject } from '@nestjs/common';
import { IFlashcardRepository } from '../../../domain/flashcard/repositories/flashcard.repository.interface';
import { IClassRepository } from '../../../domain/class/repositories/class.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { User } from '../../../domain/user/entities/user.entity';

@Injectable()
export class ListFlashcardSetsUseCase {
  constructor(
    @Inject(TOKENS.FLASHCARD_REPO) private readonly flashcardRepo: IFlashcardRepository,
    @Inject(TOKENS.CLASS_REPO) private readonly classRepo: IClassRepository,
  ) {}

  async execute(classId: string, user: User) {
    const classData = await this.classRepo.findById(classId);
    if (!classData) return [];

    const sets = await this.flashcardRepo.findSetsByClassId(classId);
    // Users see their own flashcards, flashcards created by the lecturer, and public flashcards
    return sets.filter(
      (s) => s.createdBy === user.id || s.createdBy === classData.lecturerId || s.isPublic,
    );
  }
}
