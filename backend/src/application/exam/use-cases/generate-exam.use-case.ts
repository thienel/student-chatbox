import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IExamRepository } from '../../../domain/exam/repositories/exam.repository.interface';
import { ISubjectRepository } from '../../../domain/subject/repositories/subject.repository.interface';
import { IAiUsageLogRepository } from '../../../domain/system/repositories/ai-usage-log.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { AiServiceClient } from '../../../infrastructure/ai/ai-service.client';
import { ClassContextService } from '../../class/services/class-context.service';
import { User } from '../../../domain/user/entities/user.entity';
import { GenerateExamDto } from '../dtos/exam.dto';

@Injectable()
export class GenerateExamUseCase {
  constructor(
    @Inject(TOKENS.EXAM_REPO) private readonly examRepo: IExamRepository,
    @Inject(TOKENS.SUBJECT_REPO) private readonly subjectRepo: ISubjectRepository,
    @Inject(TOKENS.AI_USAGE_LOG_REPO) private readonly usageLogRepo: IAiUsageLogRepository,
    private readonly aiServiceClient: AiServiceClient,
    private readonly classContext: ClassContextService,
  ) {}

  async execute(subjectId: string, classId: string, dto: GenerateExamDto, user: User) {
    const subject = await this.subjectRepo.findById(subjectId);
    if (!subject) throw new NotFoundException('Subject not found');

    // Questions are generated from the lecturer's knowledge base for the subject.
    const lecturerId = await this.classContext.getLecturerIdForClass(classId);
    const questionCount = dto.questionCount ?? 10;
    const difficulty = dto.difficulty ?? 'medium';

    const generatedQuestions = await this.aiServiceClient.generateExam(
      subjectId, lecturerId, questionCount, difficulty, dto.topic, dto.documentIds,
    );

    const title = dto.topic
      ? `Đề thi AI: ${dto.topic} (${difficulty})`
      : `Đề thi AI: ${subject.name} (${difficulty})`;

    const exam = await this.examRepo.createExam({
      subjectId, classId, title, type: 'ai_generated',
      difficulty, questionCount: generatedQuestions.length,
      isPublic: false, createdBy: user.id,
    });

    await this.examRepo.createQuestions(
      generatedQuestions.map((q, i) => ({
        examId: exam.id, content: q.content, options: q.options,
        correctAnswer: q.correct_answer, explanation: q.explanation,
        topic: q.topic, position: i,
      })),
    );

    const today = new Date().toISOString().split('T')[0];
    await this.usageLogRepo.increment(user.id, 'generate_exam', today);

    return exam;
  }
}
