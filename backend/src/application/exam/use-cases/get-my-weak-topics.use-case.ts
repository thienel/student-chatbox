import { Injectable, Inject } from '@nestjs/common';
import { IWeakTopicRepository } from '../../../domain/exam/repositories/weak-topic.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { User } from '../../../domain/user/entities/user.entity';

const MAX_SUGGESTIONS = 3;

@Injectable()
export class GetMyWeakTopicsUseCase {
  constructor(
    @Inject(TOKENS.WEAK_TOPIC_REPO) private readonly weakTopicRepo: IWeakTopicRepository,
  ) {}

  async execute(subjectId: string, user: User) {
    const topics = await this.weakTopicRepo.findByUserSubject(user.id, subjectId);

    const enriched = await Promise.all(
      topics.map(async (t) => ({
        ...t,
        // Only weak topics get study suggestions.
        suggestedFlashcardSets:
          t.classification === 'weak'
            ? await this.weakTopicRepo.suggestSets(t.topic, MAX_SUGGESTIONS)
            : [],
      })),
    );

    return { subjectId, topics: enriched };
  }
}
