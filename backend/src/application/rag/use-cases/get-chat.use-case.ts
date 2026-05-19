import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IChatRepository } from '../../../domain/chat/repositories/chat.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';

@Injectable()
export class GetChatUseCase {
  constructor(
    @Inject(TOKENS.CHAT_REPO) private readonly chatRepo: IChatRepository,
  ) {}

  async execute(chatId: string, userId: string, isAdmin: boolean) {
    const chat = await this.chatRepo.findById(chatId);
    if (!chat) throw new NotFoundException('Chat not found');
    if (!isAdmin && chat.userId !== userId) throw new ForbiddenException();

    const messages = await this.chatRepo.findMessages(chatId);
    return { ...chat, messages };
  }
}
