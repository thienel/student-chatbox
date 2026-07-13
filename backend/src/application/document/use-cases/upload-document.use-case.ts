import { Injectable, Inject, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { IDocumentRepository } from '../../../domain/document/repositories/document.repository.interface';
import { ISubjectRepository } from '../../../domain/subject/repositories/subject.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { Document } from '../../../domain/document/entities/document.entity';
import { LocalFileService } from '../../../infrastructure/storage/local-file.service';
import { AiServiceClient } from '../../../infrastructure/ai/ai-service.client';
import { User } from '../../../domain/user/entities/user.entity';
import { fileTypeFromFile } from 'file-type';

@Injectable()
export class UploadDocumentUseCase {
  constructor(
    @Inject(TOKENS.DOCUMENT_REPO) private readonly documentRepo: IDocumentRepository,
    @Inject(TOKENS.SUBJECT_REPO) private readonly subjectRepo: ISubjectRepository,
    private readonly fileService: LocalFileService,
    private readonly aiServiceClient: AiServiceClient,
  ) {}

  async execute(
    subjectId: string,
    file: Express.Multer.File,
    uploadedBy: User,
  ): Promise<Document> {
    if (!file?.path) throw new BadRequestException('A document file is required');
    let storedPath: string | undefined;
    try {
      const subject = await this.subjectRepo.findById(subjectId);
      if (!subject) throw new NotFoundException('Subject not found');

      if (uploadedBy.roleName === 'lecturer') {
        const isAssigned = await this.subjectRepo.isLecturerAssigned(subjectId, uploadedBy.id);
        if (!isAssigned) throw new ForbiddenException('You are not assigned to this subject');
      }

      const allowed = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      ];
      const detected = await fileTypeFromFile(file.path);
      if (!detected || !allowed.includes(detected.mime)) {
        throw new BadRequestException('Only PDF, DOCX, and PPTX files with a valid file signature are allowed');
      }

      const stored = await this.fileService.saveFile(file, subjectId, detected.mime);
      storedPath = stored.storedPath;

      const document = await this.documentRepo.create({
        subjectId,
        originalName: file.originalname,
        storedPath: stored.storedPath,
        mimeType: stored.mimeType,
        fileSizeBytes: stored.fileSizeBytes,
        uploadedBy: uploadedBy.id,
      });

      // Kick off async processing in Python AI service (fire and forget). The
      // uploader is the lecturer who owns the subject knowledge base.
      this.aiServiceClient
        .processDocument(document.id, stored.storedPath, subjectId, uploadedBy.id)
        .catch((err) => {
          console.error(`Failed to queue document ${document.id} for processing:`, err);
        });

      return document;
    } catch (error) {
      if (storedPath) await this.fileService.deleteFile(storedPath);
      else await this.fileService.discardTempFile(file);
      throw error;
    }
  }
}
