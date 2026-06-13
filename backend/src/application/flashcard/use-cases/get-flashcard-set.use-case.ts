import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IFlashcardRepository } from '../../../domain/flashcard/repositories/flashcard.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { ClassContextService } from '../../class/services/class-context.service';
import { User } from '../../../domain/user/entities/user.entity';

@Injectable()
export class GetFlashcardSetUseCase {
  constructor(
    @Inject(TOKENS.FLASHCARD_REPO) private readonly flashcardRepo: IFlashcardRepository,
    private readonly classContext: ClassContextService,
  ) {}

  async execute(subjectId: string, setId: string, user: User) {
    const set = await this.flashcardRepo.findSetById(setId);
    if (!set) throw new NotFoundException('Flashcard set not found');
    await this.classContext.assertAccess(subjectId, user, set.classId);
    const cards = await this.flashcardRepo.findCardsBySetId(setId);
    return { set, cards };
  }
}
