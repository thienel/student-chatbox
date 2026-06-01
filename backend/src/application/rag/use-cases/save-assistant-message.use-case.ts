import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IChatRepository } from '../../../domain/chat/repositories/chat.repository.interface';
import { IAiUsageLogRepository } from '../../../domain/system/repositories/ai-usage-log.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { User } from '../../../domain/user/entities/user.entity';
import { SaveAssistantMessageDto } from '../dtos/chat.dto';

@Injectable()
export class SaveAssistantMessageUseCase {
  constructor(
    @Inject(TOKENS.CHAT_REPO) private readonly chatRepo: IChatRepository,
    @Inject(TOKENS.AI_USAGE_LOG_REPO) private readonly usageLogRepo: IAiUsageLogRepository,
  ) {}

  async execute(chatId: string, dto: SaveAssistantMessageDto, user: User): Promise<void> {
    const chat = await this.chatRepo.findById(chatId);
    if (!chat) throw new NotFoundException('Chat not found');
    if (chat.userId !== user.id && user.roleName !== 'admin') throw new ForbiddenException();

    await this.chatRepo.createMessage({
      chatId,
      role: 'assistant',
      content: dto.content,
      sources: dto.sources,
    });

    const today = new Date().toISOString().split('T')[0];
    await this.usageLogRepo.increment(user.id, 'chat_rag', today);
  }
}
