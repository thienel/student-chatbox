import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IFlashcardRepository } from '../../../domain/flashcard/repositories/flashcard.repository.interface';
import { ISubjectRepository } from '../../../domain/subject/repositories/subject.repository.interface';
import { IAiUsageLogRepository } from '../../../domain/system/repositories/ai-usage-log.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { AiServiceClient } from '../../../infrastructure/ai/ai-service.client';
import { ClassContextService } from '../../class/services/class-context.service';
import { User } from '../../../domain/user/entities/user.entity';
import { GenerateFlashcardsDto } from '../dtos/flashcard.dto';

@Injectable()
export class GenerateFlashcardsUseCase {
  constructor(
    @Inject(TOKENS.FLASHCARD_REPO) private readonly flashcardRepo: IFlashcardRepository,
    @Inject(TOKENS.SUBJECT_REPO) private readonly subjectRepo: ISubjectRepository,
    @Inject(TOKENS.AI_USAGE_LOG_REPO) private readonly usageLogRepo: IAiUsageLogRepository,
    private readonly aiServiceClient: AiServiceClient,
    private readonly classContext: ClassContextService,
  ) {}

  async execute(subjectId: string, classId: string, dto: GenerateFlashcardsDto, user: User) {
    const subject = await this.subjectRepo.findById(subjectId);
    if (!subject) throw new NotFoundException('Subject not found');

    // Cards are generated from the lecturer's knowledge base for the subject.
    const lecturerId = await this.classContext.getLecturerIdForClass(classId);
    const cardCount = dto.cardCount ?? 10;
    const generatedCards = await this.aiServiceClient.generateFlashcards(
      subjectId,
      lecturerId,
      cardCount,
      dto.topic,
      dto.documentIds,
    );

    const title = dto.topic
      ? `Flashcards: ${dto.topic}`
      : `Flashcards: ${subject.name}`;

    const set = await this.flashcardRepo.createSet({
      subjectId,
      classId,
      title,
      isPublic: true,
      createdBy: user.id,
    });

    const cards = await this.flashcardRepo.createCards(
      generatedCards.map((c, i) => ({
        setId: set.id,
        front: c.front,
        back: c.back,
        position: i,
      })),
    );

    const today = new Date().toISOString().split('T')[0];
    await this.usageLogRepo.increment(user.id, 'generate_flashcard', today);

    return { set, cards };
  }
}
