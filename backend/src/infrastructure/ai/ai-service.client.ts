import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

export interface StreamTokenPayload {
  chatId: string;
  subjectId: string;
  content: string;
  chatHistory: { role: string; content: string }[];
  topK: number;
  minScore: number;
  userId: string;
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

  async processDocument(documentId: string, filePath: string, subjectId: string): Promise<void> {
    const url = `${this.aiServiceUrl}/documents/process`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-key': this.aiServiceSecret,
      },
      body: JSON.stringify({ documentId, filePath, subjectId }),
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`AI service /documents/process failed: ${response.status} ${body}`);
    }
    this.logger.log(`Document processing queued: ${documentId}`);
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
}
