import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

export interface StreamTokenPayload {
  chatId: string;
  subjectId: string;
  lecturerId: string;
  content: string;
  chatHistory: { role: string; content: string }[];
  topK: number;
  minScore: number;
  userId: string;
}

export interface GeneratedFlashcard {
  front: string;
  back: string;
}

export interface GeneratedQuestion {
  content: string;
  options: { key: string; text: string }[];
  correct_answer: string;
  explanation?: string;
  topic?: string;
}

@Injectable()
export class AiServiceClient {
  private readonly logger = new Logger(AiServiceClient.name);
  private readonly aiServiceUrl: string;
  private readonly aiServiceSecret: string;

  constructor(
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.aiServiceUrl = this.config.get<string>('AI_SERVICE_URL', 'http://localhost:8000');
    this.aiServiceSecret = this.config.get<string>('AI_SERVICE_SECRET', '');
  }

  issueStreamToken(payload: StreamTokenPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.aiServiceSecret,
      expiresIn: '5m',
    });
  }

  async *streamChat(streamToken: string, payload: object): AsyncGenerator<string> {
    const url = `${this.aiServiceUrl}/chat/stream`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${streamToken}`,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok || !response.body) {
      const text = response.body ? await response.text().catch(() => '') : '';
      throw new Error(`AI chat stream failed: ${response.status} ${text}`);
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        yield decoder.decode(value, { stream: true });
      }
    } finally {
      reader.cancel().catch(() => {});
    }
  }

  async processDocument(
    documentId: string,
    filePath: string,
    subjectId: string,
    lecturerId: string,
  ): Promise<void> {
    const url = `${this.aiServiceUrl}/documents/process`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-key': this.aiServiceSecret,
      },
      body: JSON.stringify({ documentId, filePath, subjectId, lecturerId }),
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`AI service /documents/process failed: ${response.status} ${body}`);
    }
    this.logger.log(`Document processing queued: ${documentId}`);
  }

  async summarizeDocument(documentId: string): Promise<string> {
    const url = `${this.aiServiceUrl}/documents/summarize`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-key': this.aiServiceSecret,
      },
      body: JSON.stringify({ documentId }),
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`AI service /documents/summarize failed: ${response.status} ${body}`);
    }
    const data = (await response.json()) as { summary: string };
    return data.summary;
  }

  async deleteDocumentVectors(documentId: string): Promise<void> {
    const url = `${this.aiServiceUrl}/documents/${documentId}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: { 'x-internal-key': this.aiServiceSecret },
    });
    if (!response.ok && response.status !== 404) {
      throw new Error(`AI service DELETE /documents/${documentId} failed: ${response.status}`);
    }
  }

  async generateFlashcards(
    subjectId: string,
    lecturerId: string,
    cardCount: number,
    topic?: string,
    documentIds?: string[],
  ): Promise<GeneratedFlashcard[]> {
    const url = `${this.aiServiceUrl}/flashcards/generate`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-key': this.aiServiceSecret,
      },
      body: JSON.stringify({
        subject_id: subjectId,
        lecturer_id: lecturerId,
        card_count: cardCount,
        topic,
        document_ids: documentIds,
      }),
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`AI service /flashcards/generate failed: ${response.status} ${body}`);
    }
    const data = (await response.json()) as { cards: GeneratedFlashcard[] };
    return data.cards;
  }

  async generateExam(
    subjectId: string,
    lecturerId: string,
    questionCount: number,
    difficulty: 'easy' | 'medium' | 'hard',
    topic?: string,
    documentIds?: string[],
  ): Promise<GeneratedQuestion[]> {
    const url = `${this.aiServiceUrl}/exams/generate`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-key': this.aiServiceSecret,
      },
      body: JSON.stringify({
        subject_id: subjectId,
        lecturer_id: lecturerId,
        question_count: questionCount,
        difficulty,
        topic,
        document_ids: documentIds,
      }),
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`AI service /exams/generate failed: ${response.status} ${body}`);
    }
    const data = (await response.json()) as { questions: GeneratedQuestion[] };
    return data.questions;
  }
}
