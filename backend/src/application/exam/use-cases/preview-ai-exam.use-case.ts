import { Injectable, Inject, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { ISubjectRepository } from '../../../domain/subject/repositories/subject.repository.interface';
import { IAiUsageLogRepository } from '../../../domain/system/repositories/ai-usage-log.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { AiServiceClient, GeneratedQuestion } from '../../../infrastructure/ai/ai-service.client';
import { ClassContextService } from '../../class/services/class-context.service';
import { User } from '../../../domain/user/entities/user.entity';
import { GenerateExamDto } from '../dtos/exam.dto';
import { ictDateString } from '../../../shared/utils/ict-time';

/**
 * Generates AI exam questions without persisting them to the database.
 * Used by Lecturers to draft questions that will be reviewed and saved
 * as part of a new Official Exam via the standard create-official flow.
 */
@Injectable()
export class PreviewAiExamUseCase {
  constructor(
    @Inject(TOKENS.SUBJECT_REPO) private readonly subjectRepo: ISubjectRepository,
    @Inject(TOKENS.AI_USAGE_LOG_REPO) private readonly usageLogRepo: IAiUsageLogRepository,
    private readonly aiServiceClient: AiServiceClient,
    private readonly classContext: ClassContextService,
  ) {}

  async execute(
    subjectId: string,
    dto: GenerateExamDto,
    user: User,
  ): Promise<{ questions: GeneratedQuestion[] }> {
    const subject = await this.subjectRepo.findById(subjectId);
    if (!subject) throw new NotFoundException('Subject not found');

    // For Lecturers the classId is their own class; we resolve it to get
    // the lecturerId for the RAG knowledge-base query.
    const resolvedClassId = await this.classContext.resolveClassId(subjectId, user, dto.classId);
    const lecturerId = await this.classContext.getLecturerIdForClass(resolvedClassId);

    const questionCount = dto.questionCount ?? 10;
    const difficulty = dto.difficulty ?? 'medium';

    const questions = await this.aiServiceClient.generateExam(
      subjectId, lecturerId, questionCount, difficulty, dto.topic, dto.documentIds,
    );

    if (!questions || questions.length === 0) {
      throw new UnprocessableEntityException(
        'Failed to generate exam questions. Please check if the subject has processed documents.',
      );
    }

    // Log usage so rate-limiting still applies even though no exam is saved.
    const today = ictDateString();
    await this.usageLogRepo.increment(user.id, 'generate_exam', today);

    return { questions };
  }
}
