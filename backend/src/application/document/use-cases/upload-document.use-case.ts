import { Injectable, Inject, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { IDocumentRepository } from '../../../domain/document/repositories/document.repository.interface';
import { ISubjectRepository } from '../../../domain/subject/repositories/subject.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { Document } from '../../../domain/document/entities/document.entity';
import { LocalFileService } from '../../../infrastructure/storage/local-file.service';
import { DocumentProcessorService } from '../../../infrastructure/ai/document-processor.service';
import { User } from '../../../domain/user/entities/user.entity';

@Injectable()
export class UploadDocumentUseCase {
  constructor(
    @Inject(TOKENS.DOCUMENT_REPO) private readonly documentRepo: IDocumentRepository,
    @Inject(TOKENS.SUBJECT_REPO) private readonly subjectRepo: ISubjectRepository,
    private readonly fileService: LocalFileService,
    private readonly processorService: DocumentProcessorService,
  ) {}

  async execute(
    subjectId: string,
    file: Express.Multer.File,
    uploadedBy: User,
  ): Promise<Document> {
    const subject = await this.subjectRepo.findById(subjectId);
    if (!subject) throw new NotFoundException('Subject not found');

    // Lecturers must be assigned to the subject
    if (uploadedBy.roleName === 'lecturer') {
      const isAssigned = await this.subjectRepo.isLecturerAssigned(subjectId, uploadedBy.id);
      if (!isAssigned) {
        throw new ForbiddenException('You are not assigned to this subject');
      }
    }

    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only PDF, DOCX, and PPTX files are allowed');
    }

    const { storedPath, mimeType, fileSizeBytes } = await this.fileService.saveFile(file, subjectId);

    const document = await this.documentRepo.create({
      subjectId,
      originalName: file.originalname,
      storedPath,
      mimeType,
      fileSizeBytes,
      uploadedBy: uploadedBy.id,
    });

    // Process async (fire and forget)
    this.processorService.processDocument(document.id, storedPath, subjectId).catch((err) => {
      console.error(`Background processing failed for document ${document.id}:`, err);
    });

    return document;
  }
}
