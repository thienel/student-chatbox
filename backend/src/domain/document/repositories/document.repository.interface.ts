import { Document, DocumentStatus } from '../entities/document.entity';

export interface IDocumentRepository {
  findById(id: string): Promise<Document | null>;
  findBySubjectId(subjectId: string): Promise<Document[]>;
  /** Documents forming a lecturer's knowledge base for a subject. */
  findBySubjectAndUploader(subjectId: string, uploaderId: string): Promise<Document[]>;
  create(document: Partial<Document>): Promise<Document>;
  updateStatus(id: string, status: DocumentStatus, chunkCount?: number, errorMessage?: string): Promise<void>;
  updateSummary(id: string, summary: string): Promise<void>;
  delete(id: string): Promise<void>;
}
