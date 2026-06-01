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
} from '@nestjs/common';
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
import { CreateChatDto, SendMessageDto, SaveAssistantMessageDto } from '../../../application/rag/dtos/chat.dto';
import { User } from '../../../domain/user/entities/user.entity';

@Controller('chats')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class ChatController {
  constructor(
    private readonly createChatUseCase: CreateChatUseCase,
    private readonly listChatsUseCase: ListChatsUseCase,
    private readonly getChatUseCase: GetChatUseCase,
    private readonly deleteChatUseCase: DeleteChatUseCase,
    private readonly prepareRagStreamUseCase: PrepareRagStreamUseCase,
    private readonly saveAssistantMessageUseCase: SaveAssistantMessageUseCase,
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
  async prepareStream(
    @Param('id') chatId: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: User,
  ) {
    return this.prepareRagStreamUseCase.execute(chatId, dto, user);
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
