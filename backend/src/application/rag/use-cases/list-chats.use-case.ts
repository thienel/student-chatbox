import { Injectable, Inject } from '@nestjs/common';
import { IChatRepository } from '../../../domain/chat/repositories/chat.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { Chat } from '../../../domain/chat/entities/chat.entity';

@Injectable()
export class ListChatsUseCase {
  constructor(
    @Inject(TOKENS.CHAT_REPO) private readonly chatRepo: IChatRepository,
  ) {}

  async execute(userId: string, subjectId?: string): Promise<Chat[]> {
    return this.chatRepo.findByUserIdAndSubjectId(userId, subjectId);
  }
}
