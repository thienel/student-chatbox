import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  Res,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionGuard } from '../../guards/permission.guard';
import { AiRateLimitGuard } from '../../guards/ai-rate-limit.guard';
import { RequirePermission } from '../../decorators/require-permission.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { CreateChatUseCase } from '../../../application/rag/use-cases/create-chat.use-case';
import { ListChatsUseCase } from '../../../application/rag/use-cases/list-chats.use-case';
import { GetChatUseCase } from '../../../application/rag/use-cases/get-chat.use-case';
import { DeleteChatUseCase } from '../../../application/rag/use-cases/delete-chat.use-case';
import { PrepareRagStreamUseCase } from '../../../application/rag/use-cases/prepare-rag-stream.use-case';
import { SaveAssistantMessageUseCase } from '../../../application/rag/use-cases/save-assistant-message.use-case';
import { AiServiceClient } from '../../../infrastructure/ai/ai-service.client';
import { CreateChatDto, SendMessageDto, SaveAssistantMessageDto } from '../../../application/rag/dtos/chat.dto';
import { User } from '../../../domain/user/entities/user.entity';

@Controller('chats')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    private readonly createChatUseCase: CreateChatUseCase,
    private readonly listChatsUseCase: ListChatsUseCase,
    private readonly getChatUseCase: GetChatUseCase,
    private readonly deleteChatUseCase: DeleteChatUseCase,
    private readonly prepareRagStreamUseCase: PrepareRagStreamUseCase,
    private readonly saveAssistantMessageUseCase: SaveAssistantMessageUseCase,
    private readonly aiServiceClient: AiServiceClient,
  ) {}

  @Post()
  @RequirePermission('chat:create')
  @HttpCode(HttpStatus.CREATED)
  async createChat(@Body() dto: CreateChatDto, @CurrentUser() user: User) {
    return this.createChatUseCase.execute(dto, user.id);
  }

  @Get()
  @RequirePermission('chat:read-own')
  async listChats(@CurrentUser() user: User, @Query('subjectId') subjectId?: string) {
    return this.listChatsUseCase.execute(user.id, subjectId);
  }

  @Get(':id')
  @RequirePermission('chat:read-own')
  async getChat(@Param('id') id: string, @CurrentUser() user: any) {
    return this.getChatUseCase.execute(id, user.id, user.role === 'admin');
  }

  @Delete(':id')
  @RequirePermission('chat:read-own')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteChat(@Param('id') id: string, @CurrentUser() user: any) {
    await this.deleteChatUseCase.execute(id, user.id, user.role === 'admin');
  }

  @Post(':id/messages')
  @RequirePermission('ai:chat-rag')
  @UseGuards(AiRateLimitGuard)
  async streamMessages(
    @Param('id') chatId: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<void> {
    const { streamToken, streamPayload } = await this.prepareRagStreamUseCase.execute(chatId, dto, user);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    let fullContent = '';
    let sources: SaveAssistantMessageDto['sources'] = [];
    let buffer = '';

    try {
      for await (const chunk of this.aiServiceClient.streamChat(streamToken, streamPayload)) {
        res.write(chunk);

        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          try {
            const parsed = JSON.parse(data) as { type: string; content?: string; sources?: SaveAssistantMessageDto['sources'] };
            if (parsed.type === 'chunk' && parsed.content) fullContent += parsed.content;
            else if (parsed.type === 'done' && parsed.sources) sources = parsed.sources;
          } catch { /* skip malformed SSE line */ }
        }
      }

      await this.saveAssistantMessageUseCase.execute(chatId, { content: fullContent, sources }, user);
    } catch (err) {
      this.logger.error('Chat stream proxy error', err);
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'AI service unavailable' })}\n\n`);
    } finally {
      res.end();
    }
  }

  @Post(':id/messages/complete')
  @RequirePermission('ai:chat-rag')
  @HttpCode(HttpStatus.NO_CONTENT)
  async saveAssistantMessage(
    @Param('id') chatId: string,
    @Body() dto: SaveAssistantMessageDto,
    @CurrentUser() user: User,
  ): Promise<void> {
    await this.saveAssistantMessageUseCase.execute(chatId, dto, user);
  }
}
