export interface Chat {
  id: string;
  title: string;
  subjectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageSource {
  documentId: string;
  originalName: string;
  excerpt: string;
  score: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: MessageSource[];
  createdAt: string;
}

export interface CreateChatRequest { subjectId: string; classId?: string; title?: string; }