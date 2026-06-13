import { Injectable, Inject, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { IDocumentRepository } from '../../../domain/document/repositories/document.repository.interface';
import { ISubjectRepository } from '../../../domain/subject/repositories/subject.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { Document } from '../../../domain/document/entities/document.entity';
import { LocalFileService } from '../../../infrastructure/storage/local-file.service';
import { AiServiceClient } from '../../../infrastructure/ai/ai-service.client';
import { User } from '../../../domain/user/entities/user.entity';

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
    classId: string,
    file: Express.Multer.File,
    uploadedBy: User,
  ): Promise<Document> {
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
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException('Only PDF, DOCX, and PPTX files are allowed');
    }

    const { storedPath, mimeType, fileSizeBytes } = await this.fileService.saveFile(file, subjectId);

    const document = await this.documentRepo.create({
      subjectId,
      classId,
      originalName: file.originalname,
      storedPath,
      mimeType,
      fileSizeBytes,
      uploadedBy: uploadedBy.id,
    });

    // Kick off async processing in Python AI service (fire and forget)
    this.aiServiceClient.processDocument(document.id, storedPath, subjectId, classId).catch((err) => {
      console.error(`Failed to queue document ${document.id} for processing:`, err);
    });

    return document;
  }
}
