import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { CreateChatUseCase } from '../../../application/rag/use-cases/create-chat.use-case';
import { ListChatsUseCase } from '../../../application/rag/use-cases/list-chats.use-case';
import { GetChatUseCase } from '../../../application/rag/use-cases/get-chat.use-case';
import { DeleteChatUseCase } from '../../../application/rag/use-cases/delete-chat.use-case';
import { PrepareRagStreamUseCase } from '../../../application/rag/use-cases/prepare-rag-stream.use-case';
import { SaveAssistantMessageUseCase } from '../../../application/rag/use-cases/save-assistant-message.use-case';
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
    PrepareRagStreamUseCase,
    SaveAssistantMessageUseCase,
  ],
})
export class ChatModule {}
