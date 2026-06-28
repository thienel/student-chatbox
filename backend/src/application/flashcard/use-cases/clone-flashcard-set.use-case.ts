import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IFlashcardRepository } from '../../../domain/flashcard/repositories/flashcard.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { ClassContextService } from '../../class/services/class-context.service';
import { User } from '../../../domain/user/entities/user.entity';

@Injectable()
export class CloneFlashcardSetUseCase {
  constructor(
    @Inject(TOKENS.FLASHCARD_REPO) private readonly flashcardRepo: IFlashcardRepository,
    private readonly classContext: ClassContextService,
  ) {}

  async execute(setId: string, user: User) {
    const original = await this.flashcardRepo.findSetById(setId);
    // Only public sets are cloneable (the owner already has their own copy).
    if (!original || (!original.isPublic && original.createdBy !== user.id)) {
      throw new NotFoundException('Flashcard set not found');
    }

    // A student's clone lands in the class they study; other roles get an
    // unscoped personal copy.
    const classId = user.roleName === 'student'
      ? await this.classContext.resolveClassId(original.subjectId, user)
      : undefined;

    return this.flashcardRepo.cloneSet(setId, user.id, classId);
  }
}
