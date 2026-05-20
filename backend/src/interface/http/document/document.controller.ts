import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionGuard } from '../../guards/permission.guard';
import { RequirePermission } from '../../decorators/require-permission.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { UploadDocumentUseCase } from '../../../application/document/use-cases/upload-document.use-case';
import { ListDocumentsUseCase } from '../../../application/document/use-cases/list-documents.use-case';
import { DeleteDocumentUseCase } from '../../../application/document/use-cases/delete-document.use-case';
import { AuditLogService } from '../../../application/system/services/audit-log.service';
import { User } from '../../../domain/user/entities/user.entity';

@Controller('subjects/:subjectId/documents')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class DocumentController {
  constructor(
    private readonly uploadDocumentUseCase: UploadDocumentUseCase,
    private readonly listDocumentsUseCase: ListDocumentsUseCase,
    private readonly deleteDocumentUseCase: DeleteDocumentUseCase,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Post()
  @RequirePermission('document:upload')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  async uploadDocument(
    @Param('subjectId') subjectId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User,
    @Req() req: Request,
  ) {
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
  async listDocuments(@Param('subjectId') subjectId: string) {
    const documents = await this.listDocumentsUseCase.execute(subjectId);
    return { items: documents, total: documents.length };
  }

  @Delete(':id')
  @RequirePermission('document:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
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
