import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IDocumentRepository } from '../../../domain/document/repositories/document.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { LocalFileService } from '../../../infrastructure/storage/local-file.service';
import { AiServiceClient } from '../../../infrastructure/ai/ai-service.client';
import { User } from '../../../domain/user/entities/user.entity';

@Injectable()
export class DeleteDocumentUseCase {
  constructor(
    @Inject(TOKENS.DOCUMENT_REPO) private readonly documentRepo: IDocumentRepository,
    private readonly fileService: LocalFileService,
    private readonly aiServiceClient: AiServiceClient,
  ) {}

  async execute(subjectId: string, documentId: string, currentUser: User): Promise<void> {
    const document = await this.documentRepo.findById(documentId);
    if (!document || document.subjectId !== subjectId) {
      throw new NotFoundException('Document not found');
    }

    if (currentUser.roleName === 'lecturer' && document.uploadedBy !== currentUser.id) {
      throw new ForbiddenException('You can only delete documents you uploaded');
    }

    await this.aiServiceClient.deleteDocumentVectors(documentId);
    await this.fileService.deleteFile(document.storedPath);
    await this.documentRepo.delete(documentId);
  }
}
