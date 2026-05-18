import { Injectable, Logger, Inject } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { v4 as uuidv4 } from 'uuid';
import { LangchainRagService } from './langchain-rag.service';
import { QdrantService } from '../database/qdrant/qdrant.service';
import { IDocumentRepository } from '../../domain/document/repositories/document.repository.interface';
import { DocumentStatus } from '../../domain/document/entities/document.entity';
import { TOKENS } from '../../shared/constants/tokens';

@Injectable()
export class DocumentProcessorService {
  private readonly logger = new Logger(DocumentProcessorService.name);
  private readonly splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  constructor(
    private readonly ragService: LangchainRagService,
    private readonly qdrant: QdrantService,
    @Inject(TOKENS.DOCUMENT_REPO)
    private readonly documentRepo: IDocumentRepository,
  ) {}

  async processDocument(documentId: string, filePath: string, subjectId: string): Promise<void> {
    try {
      this.logger.log(`Processing document ${documentId}`);

      // 1. Extract text
      const text = await this.extractText(filePath);
      if (!text || text.trim().length === 0) {
        throw new Error('Could not extract text from document');
      }

      // 2. Split into chunks
      const chunks = await this.splitter.splitText(text);
      if (chunks.length === 0) {
        throw new Error('Document produced no chunks');
      }

      // 3. Embed all chunks
      const vectors = await this.ragService.embedDocuments(chunks);

      // 4. Get original filename from path
      const originalName = path.basename(filePath).replace(/^[^_]+_/, '');

      // 5. Upsert to Qdrant
      const points = chunks.map((chunk, i) => ({
        id: uuidv4(),
        vector: vectors[i],
        payload: {
          document_id: documentId,
          subject_id: subjectId,
          chunk_index: i,
          text: chunk,
          original_name: originalName,
        },
      }));

      await this.qdrant.upsertPoints(points);

      // 6. Update status to ready
      await this.documentRepo.updateStatus(documentId, DocumentStatus.READY, chunks.length);
      this.logger.log(`Document ${documentId} processed: ${chunks.length} chunks`);
    } catch (error) {
      this.logger.error(`Document ${documentId} processing failed: ${error}`);
      await this.documentRepo.updateStatus(
        documentId,
        DocumentStatus.FAILED,
        0,
        String(error),
      );
    }
  }

  private async extractText(filePath: string): Promise<string> {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.pdf') {
      return this.extractPdf(filePath);
    } else if (ext === '.docx') {
      return this.extractDocx(filePath);
    } else if (ext === '.pptx') {
      return this.extractPptx(filePath);
    } else {
      throw new Error(`Unsupported file type: ${ext}`);
    }
  }

  private async extractPdf(filePath: string): Promise<string> {
    const pdfParse = require('pdf-parse');
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  }

  private async extractDocx(filePath: string): Promise<string> {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  private async extractPptx(filePath: string): Promise<string> {
    const officeParser = require('officeparser');
    return new Promise((resolve, reject) => {
      officeParser.parseOffice(filePath, (data: string, err: Error) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }
}
