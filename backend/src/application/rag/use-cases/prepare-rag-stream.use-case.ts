import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IChatRepository } from '../../../domain/chat/repositories/chat.repository.interface';
import { ISystemSettingRepository } from '../../../domain/system/repositories/system-setting.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { AiServiceClient } from '../../../infrastructure/ai/ai-service.client';
import { User } from '../../../domain/user/entities/user.entity';
import { SendMessageDto } from '../dtos/chat.dto';

@Injectable()
export class PrepareRagStreamUseCase {
  constructor(
    @Inject(TOKENS.CHAT_REPO) private readonly chatRepo: IChatRepository,
    @Inject(TOKENS.SYSTEM_SETTING_REPO) private readonly settingRepo: ISystemSettingRepository,
    private readonly aiServiceClient: AiServiceClient,
    private readonly config: ConfigService,
  ) {}

  async execute(
    chatId: string,
    dto: SendMessageDto,
    user: User,
  ): Promise<{ streamToken: string; streamUrl: string; streamPayload: object }> {
    const chat = await this.chatRepo.findById(chatId);
    if (!chat) throw new NotFoundException('Chat not found');
    if (chat.userId !== user.id && user.roleName !== 'admin') throw new ForbiddenException();

    const topK = Number((await this.settingRepo.findByKey('rag.top_k'))?.value ?? 5);
    const minScore = Number((await this.settingRepo.findByKey('rag.min_score'))?.value ?? 0.4);

    const existingMessages = await this.chatRepo.findMessages(chatId);
    const chatHistory = existingMessages
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content }));

    await this.chatRepo.createMessage({ chatId, role: 'user', content: dto.content });

    const streamToken = this.aiServiceClient.issueStreamToken({
      chatId,
      subjectId: chat.subjectId,
      content: dto.content,
      chatHistory,
      topK,
      minScore,
      userId: user.id,
    });

    const streamUrl = this.config.get<string>('AI_SERVICE_URL', 'http://localhost:8000');

    return {
      streamToken,
      streamUrl,
      streamPayload: {
        content: dto.content,
        subjectId: chat.subjectId,
        chatHistory,
        topK,
        minScore,
      },
    };
  }
}
