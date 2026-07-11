import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IFlashcardRepository } from '../../../domain/flashcard/repositories/flashcard.repository.interface';
import { IClassRepository } from '../../../domain/class/repositories/class.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { User } from '../../../domain/user/entities/user.entity';

@Injectable()
export class GetFlashcardSetUseCase {
  constructor(
    @Inject(TOKENS.FLASHCARD_REPO) private readonly flashcardRepo: IFlashcardRepository,
    @Inject(TOKENS.CLASS_REPO) private readonly classRepo: IClassRepository,
  ) {}

  async execute(setId: string, user: User) {
    const set = await this.flashcardRepo.findSetById(setId);
    if (!set) throw new NotFoundException('Flashcard set not found');
    
    if (set.createdBy === user.id || set.isPublic) {
      // Always accessible if you are the creator or it is public
    } else if (set.classId) {
      const classData = await this.classRepo.findById(set.classId);
      if (!classData) throw new ForbiddenException('Class not found');
      
      const isCreatedByLecturer = set.createdBy === classData.lecturerId;
      
      if (!isCreatedByLecturer) {
        throw new ForbiddenException('You do not have access to this set');
      }
    } else {
      throw new ForbiddenException('You do not have access to this set');
    }

    const cards = await this.flashcardRepo.findCardsBySetId(setId);
    return { set, cards };
  }
}
