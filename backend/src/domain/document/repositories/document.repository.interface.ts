import { Document, DocumentStatus } from '../entities/document.entity';

export interface IDocumentRepository {
  findById(id: string): Promise<Document | null>;
  findBySubjectId(subjectId: string): Promise<Document[]>;
  findByClassId(classId: string): Promise<Document[]>;
  create(document: Partial<Document>): Promise<Document>;
  updateStatus(id: string, status: DocumentStatus, chunkCount?: number, errorMessage?: string): Promise<void>;
  delete(id: string): Promise<void>;
}
