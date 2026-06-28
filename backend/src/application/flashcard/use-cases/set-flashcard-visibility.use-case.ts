import {
  Injectable, Inject, NotFoundException, ForbiddenException, UnprocessableEntityException,
} from '@nestjs/common';
import { IFlashcardRepository } from '../../../domain/flashcard/repositories/flashcard.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { User } from '../../../domain/user/entities/user.entity';

const MIN_CARDS_TO_PUBLISH = 3;

@Injectable()
export class SetFlashcardVisibilityUseCase {
  constructor(
    @Inject(TOKENS.FLASHCARD_REPO) private readonly flashcardRepo: IFlashcardRepository,
  ) {}

  async execute(setId: string, isPublic: boolean, user: User) {
    const set = await this.flashcardRepo.findSetById(setId);
    if (!set) throw new NotFoundException('Flashcard set not found');
    if (set.createdBy !== user.id) {
      throw new ForbiddenException('Only the creator can change visibility');
    }

    if (isPublic) {
      const cardCount = await this.flashcardRepo.countCardsBySetId(setId);
      if (cardCount < MIN_CARDS_TO_PUBLISH) {
        throw new UnprocessableEntityException(
          `A set needs at least ${MIN_CARDS_TO_PUBLISH} cards to be published`,
        );
      }
    }

    return this.flashcardRepo.setVisibility(setId, isPublic);
  }
}
