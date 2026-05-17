export type MessageRole = 'user' | 'assistant';

export interface MessageSource {
  documentId: string;
  originalName: string;
  excerpt: string;
  score: number;
}

export class Message {
  id: string;
  chatId: string;
  role: MessageRole;
  content: string;
  sources?: MessageSource[];
  createdAt: Date;
}
