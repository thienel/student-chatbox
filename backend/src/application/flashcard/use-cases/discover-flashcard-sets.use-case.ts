import { Injectable, Inject } from '@nestjs/common';
import { IFlashcardRepository } from '../../../domain/flashcard/repositories/flashcard.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { User } from '../../../domain/user/entities/user.entity';

const PAGE_SIZE = 20;

@Injectable()
export class DiscoverFlashcardSetsUseCase {
  constructor(
    @Inject(TOKENS.FLASHCARD_REPO) private readonly flashcardRepo: IFlashcardRepository,
  ) {}

  async execute(
    user: User,
    opts: { subjectId?: string; sort?: 'stars' | 'newest'; page?: number },
  ) {
    const page = opts.page && opts.page > 0 ? opts.page : 1;
    const sort = opts.sort === 'newest' ? 'newest' : 'stars';
    return this.flashcardRepo.discoverPublicSets({
      userId: user.id,
      subjectId: opts.subjectId,
      sort,
      page,
      pageSize: PAGE_SIZE,
    });
  }
}
