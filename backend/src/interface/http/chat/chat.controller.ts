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
  Sse,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionGuard } from '../../guards/permission.guard';
import { AiRateLimitGuard } from '../../guards/ai-rate-limit.guard';
import { RequirePermission } from '../../decorators/require-permission.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { CreateChatUseCase } from '../../../application/rag/use-cases/create-chat.use-case';
import { ListChatsUseCase } from '../../../application/rag/use-cases/list-chats.use-case';
import { GetChatUseCase } from '../../../application/rag/use-cases/get-chat.use-case';
import { DeleteChatUseCase } from '../../../application/rag/use-cases/delete-chat.use-case';
import { ChatWithRagUseCase } from '../../../application/rag/use-cases/chat-with-rag.use-case';
import { CreateChatDto, SendMessageDto } from '../../../application/rag/dtos/chat.dto';
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
    private readonly chatWithRagUseCase: ChatWithRagUseCase,
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
    const isAdmin = user.role === 'admin';
    return this.getChatUseCase.execute(id, user.id, isAdmin);
  }

  @Delete(':id')
  @RequirePermission('chat:read-own')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteChat(@Param('id') id: string, @CurrentUser() user: any) {
    const isAdmin = user.role === 'admin';
    await this.deleteChatUseCase.execute(id, user.id, isAdmin);
  }

  @Post(':id/messages')
  @Sse(':id/messages')
  @RequirePermission('ai:chat-rag')
  @UseGuards(AiRateLimitGuard)
  sendMessage(
    @Param('id') chatId: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: User,
  ): Observable<MessageEvent> {
    return this.chatWithRagUseCase.execute(chatId, dto, user);
  }
}
