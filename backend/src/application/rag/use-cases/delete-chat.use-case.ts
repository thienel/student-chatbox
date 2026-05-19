import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IChatRepository } from '../../../domain/chat/repositories/chat.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';

@Injectable()
export class DeleteChatUseCase {
  constructor(
    @Inject(TOKENS.CHAT_REPO) private readonly chatRepo: IChatRepository,
  ) {}

  async execute(chatId: string, userId: string, isAdmin: boolean): Promise<void> {
    const chat = await this.chatRepo.findById(chatId);
    if (!chat) throw new NotFoundException('Chat not found');
    if (!isAdmin && chat.userId !== userId) throw new ForbiddenException();
    await this.chatRepo.delete(chatId);
  }
}
