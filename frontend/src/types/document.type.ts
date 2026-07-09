export interface Document {
  id: string;
  originalName: string;
  mimeType: string;
  fileSizeBytes: number;
  status: 'processing' | 'ready' | 'failed';
  chunkCount: number;
  uploadedBy: { id: string; fullName: string };
  createdAt: string;
}

export interface DocumentSummary {
  documentId: string;
  summary: string;
  generatedAt: string | null;
  cached: boolean;
}