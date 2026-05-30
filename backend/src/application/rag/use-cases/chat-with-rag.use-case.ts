import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { IChatRepository } from '../../../domain/chat/repositories/chat.repository.interface';
import { ISystemSettingRepository } from '../../../domain/system/repositories/system-setting.repository.interface';
import { IAiUsageLogRepository } from '../../../domain/system/repositories/ai-usage-log.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { LangchainRagService } from '../../../infrastructure/ai/langchain-rag.service';
import { User } from '../../../domain/user/entities/user.entity';
import { SendMessageDto } from '../dtos/chat.dto';
import { MessageSource } from '../../../domain/chat/entities/message.entity';

@Injectable()
export class ChatWithRagUseCase {
  constructor(
    @Inject(TOKENS.CHAT_REPO) private readonly chatRepo: IChatRepository,
    @Inject(TOKENS.SYSTEM_SETTING_REPO) private readonly settingRepo: ISystemSettingRepository,
    @Inject(TOKENS.AI_USAGE_LOG_REPO) private readonly usageLogRepo: IAiUsageLogRepository,
    private readonly ragService: LangchainRagService,
  ) {}

  execute(chatId: string, dto: SendMessageDto, user: User): Observable<MessageEvent> {
    return new Observable((observer) => {
      this.executeAsync(chatId, dto, user, observer).catch((err) => {
        observer.error(err);
      });
    });
  }

  private async executeAsync(
    chatId: string,
    dto: SendMessageDto,
    user: User,
    observer: any,
  ): Promise<void> {
    const chat = await this.chatRepo.findById(chatId);
    if (!chat) throw new NotFoundException('Chat not found');
    if (chat.userId !== user.id && user.roleName !== 'admin') throw new ForbiddenException();

    // Get settings
    const topKSetting = await this.settingRepo.findByKey('rag.top_k');
    const minScoreSetting = await this.settingRepo.findByKey('rag.min_score');
    const topK = Number(topKSetting?.value ?? 5);
    const minScore = Number(minScoreSetting?.value ?? 0.7);

    // Get chat history BEFORE saving current message (avoid duplicate)
    const existingMessages = await this.chatRepo.findMessages(chatId);
    const chatHistory = existingMessages
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content }));

    // Save user message
    await this.chatRepo.createMessage({
      chatId,
      role: 'user',
      content: dto.content,
    });

    // Generate message ID
    const messageId = require('uuid').v4();
    observer.next({ data: JSON.stringify({ type: 'start', messageId }) } as MessageEvent);

    // Stream RAG response
    const { stream, sources } = await this.ragService.streamRagResponse(
      dto.content,
      chat.subjectId,
      chatHistory,
      { topK, minScore },
    );

    let fullResponse = '';
    for await (const chunk of stream) {
      fullResponse += chunk;
      observer.next({ data: JSON.stringify({ type: 'chunk', content: chunk }) } as MessageEvent);
    }

    // Map sources
    const mappedSources: MessageSource[] = sources.map((s) => ({
      documentId: s.payload.document_id,
      originalName: s.payload.original_name,
      excerpt: s.payload.text.substring(0, 200),
      score: s.score,
    }));

    // Save assistant message
    await this.chatRepo.createMessage({
      chatId,
      role: 'assistant',
      content: fullResponse,
      sources: mappedSources,
    });

    // Increment usage log
    const today = new Date().toISOString().split('T')[0];
    await this.usageLogRepo.increment(user.id, 'chat_rag', today);

    observer.next({ data: JSON.stringify({ type: 'done', sources: mappedSources }) } as MessageEvent);
    observer.next({ data: '[DONE]' } as MessageEvent);
    observer.complete();
  }
}
