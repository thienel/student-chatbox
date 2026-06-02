import { FlashcardSet } from '../entities/flashcard-set.entity';
import { Flashcard } from '../entities/flashcard.entity';

export interface IFlashcardRepository {
  createSet(data: Partial<FlashcardSet>): Promise<FlashcardSet>;
  findSetById(id: string): Promise<FlashcardSet | null>;
  findSetsBySubjectId(subjectId: string): Promise<FlashcardSet[]>;
  deleteSet(id: string): Promise<void>;

  createCards(cards: Array<{ setId: string; front: string; back: string; position: number }>): Promise<Flashcard[]>;
  findCardsBySetId(setId: string): Promise<Flashcard[]>;
}
