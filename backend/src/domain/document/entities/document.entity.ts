export enum DocumentStatus {
  PROCESSING = 'processing',
  READY = 'ready',
  FAILED = 'failed',
}

export class Document {
  id: string;
  subjectId: string;
  originalName: string;
  storedPath: string;
  mimeType: string;
  fileSizeBytes?: number;
  status: DocumentStatus;
  chunkCount: number;
  errorMessage?: string;
  uploadedBy: string;
  uploadedByUser?: { id: string; fullName: string };
  summary?: string;
  summaryGeneratedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
