import { Controller, Patch, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { InternalKeyGuard } from '../../guards/internal-key.guard';
import { IDocumentRepository } from '../../../domain/document/repositories/document.repository.interface';
import { DocumentStatus } from '../../../domain/document/entities/document.entity';
import { TOKENS } from '../../../shared/constants/tokens';

class ProcessingResultDto {
  @IsIn(['ready', 'failed'])
  status: 'ready' | 'failed';

  @IsOptional()
  @IsNumber()
  chunkCount?: number;

  @IsOptional()
  @IsString()
  error?: string;
}

@Controller('internal')
@UseGuards(InternalKeyGuard)
export class InternalController {
  constructor(
    @Inject(TOKENS.DOCUMENT_REPO)
    private readonly documentRepo: IDocumentRepository,
  ) {}

  @Patch('documents/:id/processing-result')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateProcessingResult(
    @Param('id') documentId: string,
    @Body() body: ProcessingResultDto,
  ): Promise<void> {
    const status = body.status === 'ready' ? DocumentStatus.READY : DocumentStatus.FAILED;
    await this.documentRepo.updateStatus(documentId, status, body.chunkCount ?? 0, body.error);
  }
}
