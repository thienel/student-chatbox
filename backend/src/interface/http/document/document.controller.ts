import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionGuard } from '../../guards/permission.guard';
import { AiRateLimitGuard } from '../../guards/ai-rate-limit.guard';
import { RequirePermission } from '../../decorators/require-permission.decorator';
import { AiFeature } from '../../decorators/ai-feature.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { UploadDocumentUseCase } from '../../../application/document/use-cases/upload-document.use-case';
import { ListDocumentsUseCase } from '../../../application/document/use-cases/list-documents.use-case';
import { DeleteDocumentUseCase } from '../../../application/document/use-cases/delete-document.use-case';
import { SummarizeDocumentUseCase } from '../../../application/document/use-cases/summarize-document.use-case';
import { AuditLogService } from '../../../application/system/services/audit-log.service';
import { ClassContextService } from '../../../application/class/services/class-context.service';
import { User } from '../../../domain/user/entities/user.entity';
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

@Controller('subjects/:subjectId/documents')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@ApiTags('Document')
export class DocumentController {
  constructor(
    private readonly uploadDocumentUseCase: UploadDocumentUseCase,
    private readonly listDocumentsUseCase: ListDocumentsUseCase,
    private readonly deleteDocumentUseCase: DeleteDocumentUseCase,
    private readonly summarizeDocumentUseCase: SummarizeDocumentUseCase,
    private readonly auditLogService: AuditLogService,
    private readonly classContext: ClassContextService,
  ) {}

  @Post()
  @RequirePermission('document:create')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: process.env.UPLOAD_TMP_DIR ?? './uploads/tmp',
        filename: (_request, file, callback) => callback(null, `${randomUUID()}-${file.originalname}`),
      }),
      limits: { fileSize: 50 * 1024 * 1024, files: 1, fields: 10, parts: 12 },
    }),
  )
    @ApiOperation({ summary: 'Upload document' })
  async uploadDocument(
    @Param('subjectId') subjectId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User,
    @Req() req: Request,
  ) {
    if (!file) throw new BadRequestException('A document file is required');
    const document = await this.uploadDocumentUseCase.execute(subjectId, file, user);
    await this.auditLogService.log(
      user.id,
      'DOCUMENT_UPLOADED',
      'document',
      document.id,
      { originalName: file.originalname, subjectId },
      req.ip,
    );
    return {
      id: document.id,
      originalName: document.originalName,
      status: document.status,
    };
  }

  @Get()
  @RequirePermission('document:read')
    @ApiOperation({ summary: 'List documents' })
  async listDocuments(
    @Param('subjectId') subjectId: string,
    @CurrentUser() user: User,
  ) {
    const lecturerId = await this.classContext.resolveLecturerId(subjectId, user);
    const documents = await this.listDocumentsUseCase.execute(subjectId, lecturerId);
    return { items: documents, total: documents.length };
  }

  @Get(':id/summary')
  @RequirePermission('ai:summarize-document')
  @AiFeature('summarize_document')
  @UseGuards(AiRateLimitGuard)
    @ApiOperation({ summary: 'Get summary' })
  async getSummary(
    @Param('subjectId') subjectId: string,
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.summarizeDocumentUseCase.execute(subjectId, id, user);
  }

  @Delete(':id')
  @RequirePermission('document:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete document' })
  async deleteDocument(
    @Param('subjectId') subjectId: string,
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Req() req: Request,
  ) {
    await this.deleteDocumentUseCase.execute(subjectId, id, user);
    await this.auditLogService.log(user.id, 'DOCUMENT_DELETED', 'document', id, { subjectId }, req.ip);
  }
}
