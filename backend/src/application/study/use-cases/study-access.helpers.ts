import { NotFoundException } from '@nestjs/common';
import { IFlashcardRepository } from '../../../domain/flashcard/repositories/flashcard.repository.interface';
import { FlashcardSet } from '../../../domain/flashcard/entities/flashcard-set.entity';

/** A user may study a set they own (or cloned) or any public set. */
export async function loadStudyableSet(
  flashcardRepo: IFlashcardRepository,
  setId: string,
  userId: string,
): Promise<FlashcardSet> {
  const set = await flashcardRepo.findSetById(setId);
  if (!set || (set.createdBy !== userId && !set.isPublic)) {
    throw new NotFoundException('Flashcard set not found');
  }
  return set;
}
