import {
  Injectable, Inject, NotFoundException, ConflictException, BadGatewayException,
} from '@nestjs/common';
import { IDocumentRepository } from '../../../domain/document/repositories/document.repository.interface';
import { IAiUsageLogRepository } from '../../../domain/system/repositories/ai-usage-log.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { AiServiceClient } from '../../../infrastructure/ai/ai-service.client';
import { DocumentStatus } from '../../../domain/document/entities/document.entity';
import { ClassContextService } from '../../class/services/class-context.service';
import { User } from '../../../domain/user/entities/user.entity';

@Injectable()
export class SummarizeDocumentUseCase {
  constructor(
    @Inject(TOKENS.DOCUMENT_REPO) private readonly documentRepo: IDocumentRepository,
    @Inject(TOKENS.AI_USAGE_LOG_REPO) private readonly usageLogRepo: IAiUsageLogRepository,
    private readonly aiServiceClient: AiServiceClient,
    private readonly classContext: ClassContextService,
  ) {}

  async execute(subjectId: string, documentId: string, user: User) {
    const document = await this.documentRepo.findById(documentId);
    if (!document || document.subjectId !== subjectId) {
      throw new NotFoundException('Document not found');
    }

    // The reader must share the document's lecturer knowledge base.
    const lecturerId = await this.classContext.resolveLecturerId(subjectId, user);
    if (document.uploadedBy !== lecturerId) {
      throw new NotFoundException('Document not found');
    }

    // Cached summaries are returned instantly and never re-billed.
    if (document.summary) {
      return {
        documentId,
        summary: document.summary,
        generatedAt: document.summaryGeneratedAt,
        cached: true,
      };
    }

    if (document.status !== DocumentStatus.READY) {
      throw new ConflictException('Document is not ready for summarization');
    }

    let summary: string;
    try {
      summary = await this.aiServiceClient.summarizeDocument(documentId);
    } catch {
      // A failed generation is not billed and leaves no cached summary.
      throw new BadGatewayException('AI service unavailable');
    }

    await this.documentRepo.updateSummary(documentId, summary);
    const today = new Date().toISOString().split('T')[0];
    await this.usageLogRepo.increment(user.id, 'summarize_document', today);

    return { documentId, summary, generatedAt: new Date(), cached: false };
  }
}
