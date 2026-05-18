import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIEmbeddings } from '@langchain/openai';
import OpenAI from 'openai';
import { QdrantService, SearchResult } from '../database/qdrant/qdrant.service';

@Injectable()
export class LangchainRagService {
  private readonly logger = new Logger(LangchainRagService.name);
  private readonly embeddings: OpenAIEmbeddings;
  private readonly openai: OpenAI;

  constructor(
    private readonly qdrant: QdrantService,
    private readonly config: ConfigService,
  ) {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: this.config.get<string>('OPENAI_API_KEY'),
      modelName: this.config.get<string>('OPENAI_EMBEDDING_MODEL', 'text-embedding-3-small'),
    });

    this.openai = new OpenAI({
      apiKey: this.config.get<string>('OPENAI_API_KEY'),
    });
  }

  async embedText(text: string): Promise<number[]> {
    return this.embeddings.embedQuery(text);
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    return this.embeddings.embedDocuments(texts);
  }

  async streamRagResponse(
    query: string,
    subjectId: string,
    chatHistory: { role: string; content: string }[],
    settings: { topK: number; minScore: number },
  ): Promise<{ stream: AsyncIterable<string>; sources: SearchResult[] }> {
    const queryVector = await this.embedText(query);
    const searchResults = await this.qdrant.searchSimilar(
      queryVector,
      subjectId,
      settings.topK,
      settings.minScore,
    );

    const context = searchResults
      .map((r, i) => `[Source ${i + 1}: ${r.payload.original_name}]\n${r.payload.text}`)
      .join('\n\n---\n\n');

    const systemContent = context.length > 0
      ? `You are an academic assistant for a university course. Answer ONLY based on the context provided below.
If the answer is not found in the context, say "Không tìm thấy thông tin này trong tài liệu môn học."
Always cite the source document names when answering.

Context:
${context}`
      : `You are an academic assistant. There are no relevant documents found for this query.
Please inform the user: "Không tìm thấy thông tin này trong tài liệu môn học."`;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemContent },
    ];

    for (const msg of chatHistory.slice(-10)) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    messages.push({ role: 'user', content: query });

    const chatModel = this.config.get<string>('OPENAI_CHAT_MODEL', 'gpt-4o');
    const openai = this.openai;

    async function* generateChunks(): AsyncIterable<string> {
      const stream = await openai.chat.completions.create({
        model: chatModel,
        messages,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    }

    return { stream: generateChunks(), sources: searchResults };
  }
}
