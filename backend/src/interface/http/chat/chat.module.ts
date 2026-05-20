import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { CreateChatUseCase } from '../../../application/rag/use-cases/create-chat.use-case';
import { ListChatsUseCase } from '../../../application/rag/use-cases/list-chats.use-case';
import { GetChatUseCase } from '../../../application/rag/use-cases/get-chat.use-case';
import { DeleteChatUseCase } from '../../../application/rag/use-cases/delete-chat.use-case';
import { ChatWithRagUseCase } from '../../../application/rag/use-cases/chat-with-rag.use-case';
import { TypeOrmDatabaseModule } from '../../../infrastructure/database/typeorm/typeorm.module';
import { AiModule } from '../../../infrastructure/ai/ai.module';

@Module({
  imports: [TypeOrmDatabaseModule, AiModule],
  controllers: [ChatController],
  providers: [
    CreateChatUseCase,
    ListChatsUseCase,
    GetChatUseCase,
    DeleteChatUseCase,
    ChatWithRagUseCase,
  ],
})
export class ChatModule {}
