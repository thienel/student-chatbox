import { Module } from '@nestjs/common';
import { DocumentController } from './document.controller';
import { UploadDocumentUseCase } from '../../../application/document/use-cases/upload-document.use-case';
import { ListDocumentsUseCase } from '../../../application/document/use-cases/list-documents.use-case';
import { DeleteDocumentUseCase } from '../../../application/document/use-cases/delete-document.use-case';
import { SummarizeDocumentUseCase } from '../../../application/document/use-cases/summarize-document.use-case';
import { TypeOrmDatabaseModule } from '../../../infrastructure/database/typeorm/typeorm.module';
import { AiModule } from '../../../infrastructure/ai/ai.module';
import { LocalFileService } from '../../../infrastructure/storage/local-file.service';
import { AuditLogService } from '../../../application/system/services/audit-log.service';
import { ClassModule } from '../class/class.module';

@Module({
  imports: [TypeOrmDatabaseModule, AiModule, ClassModule],
  controllers: [DocumentController],
  providers: [
    UploadDocumentUseCase,
    ListDocumentsUseCase,
    DeleteDocumentUseCase,
    SummarizeDocumentUseCase,
    LocalFileService,
    AuditLogService,
  ],
})
export class DocumentModule {}
