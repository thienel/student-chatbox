import { Injectable, Inject } from '@nestjs/common';
import { IDocumentRepository } from '../../../domain/document/repositories/document.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { Document } from '../../../domain/document/entities/document.entity';

@Injectable()
export class ListDocumentsUseCase {
  constructor(
    @Inject(TOKENS.DOCUMENT_REPO) private readonly documentRepo: IDocumentRepository,
  ) {}

  async execute(subjectId: string): Promise<Document[]> {
    return this.documentRepo.findBySubjectId(subjectId);
  }
}
