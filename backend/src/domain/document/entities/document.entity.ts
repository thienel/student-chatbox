export enum DocumentStatus {
  PROCESSING = 'processing',
  READY = 'ready',
  FAILED = 'failed',
}

export class Document {
  id: string;
  subjectId: string;
  classId?: string;
  originalName: string;
  storedPath: string;
  mimeType: string;
  fileSizeBytes?: number;
  status: DocumentStatus;
  chunkCount: number;
  errorMessage?: string;
  uploadedBy: string;
  uploadedByUser?: { id: string; fullName: string };
  createdAt: Date;
  updatedAt: Date;
}
