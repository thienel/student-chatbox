import { Chat } from '../entities/chat.entity';
import { Message } from '../entities/message.entity';

export interface IChatRepository {
  findById(id: string): Promise<Chat | null>;
  findByUserIdAndSubjectId(userId: string, subjectId?: string): Promise<Chat[]>;
  create(data: Partial<Chat>): Promise<Chat>;
  delete(id: string): Promise<void>;
  findMessages(chatId: string): Promise<Message[]>;
  createMessage(data: Partial<Message>): Promise<Message>;
}
