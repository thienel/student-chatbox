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
    const baseURL = this.config.get<string>('OPENAI_BASE_URL');
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: this.config.get<string>('OPENAI_API_KEY'),
      modelName: this.config.get<string>('OPENAI_EMBEDDING_MODEL', 'text-embedding-3-small'),
      batchSize: 100,
      ...(baseURL && { configuration: { baseURL } }),
    });

    this.openai = new OpenAI({
      apiKey: this.config.get<string>('OPENAI_API_KEY'),
      ...(baseURL && { baseURL }),
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
    this.logger.log(`RAG search: subjectId=${subjectId}, topK=${settings.topK}, minScore=${settings.minScore}, queryDim=${queryVector.length}`);
    const allResults = await this.qdrant.searchSimilar(queryVector, subjectId, settings.topK, 0);
    this.logger.log(`Qdrant returned ${allResults.length} results, scores: [${allResults.map(r => r.score.toFixed(3)).join(', ')}]`);
    const searchResults = allResults.filter(r => r.score >= settings.minScore);

    const context = searchResults
      .map((r, i) => `[Source ${i + 1}: ${r.payload.original_name}]\n${r.payload.text}`)
      .join('\n\n---\n\n');

    const systemContent = context.length > 0
      ? `You are EduChat, an academic assistant for a university course. You have access to course documents provided below.
IMPORTANT RULES:
- Answer ONLY using information from the provided context. Do NOT use your own training knowledge.
- Always mention the source document name when answering.
- If the user asks who you are, say: "Tôi là EduChat, trợ lý học tập dựa trên tài liệu môn học của bạn."
- If asked if you have documents, confirm you have the documents listed in the context.
- Never say you are trained on internet data or that you are a general AI.

Context from course documents:
${context}`
      : `You are EduChat, an academic assistant for a university course.
No relevant documents were found for this query.
Respond in the same language as the user's question.
Say: "Không tìm thấy thông tin này trong tài liệu môn học. Hãy thử đặt câu hỏi khác hoặc upload thêm tài liệu."
Do NOT answer from general knowledge.`;

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
