import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IChatRepository } from '../../../../domain/chat/repositories/chat.repository.interface';
import { Chat } from '../../../../domain/chat/entities/chat.entity';
import { Message, MessageSource } from '../../../../domain/chat/entities/message.entity';
import { ChatOrmEntity } from '../orm-entities/chat.orm-entity';
import { MessageOrmEntity } from '../orm-entities/message.orm-entity';

@Injectable()
export class ChatTypeOrmRepository implements IChatRepository {
  constructor(
    @InjectRepository(ChatOrmEntity)
    private readonly chatRepo: Repository<ChatOrmEntity>,
    @InjectRepository(MessageOrmEntity)
    private readonly messageRepo: Repository<MessageOrmEntity>,
  ) {}

  private toChatEntity(orm: ChatOrmEntity): Chat {
    const chat = new Chat();
    chat.id = orm.id;
    chat.userId = orm.userId;
    chat.subjectId = orm.subjectId;
    chat.title = orm.title;
    chat.createdAt = orm.createdAt;
    chat.updatedAt = orm.updatedAt;
    return chat;
  }

  private toMessageEntity(orm: MessageOrmEntity): Message {
    const msg = new Message();
    msg.id = orm.id;
    msg.chatId = orm.chatId;
    msg.role = orm.role as 'user' | 'assistant';
    msg.content = orm.content;
    msg.sources = orm.sources as MessageSource[];
    msg.createdAt = orm.createdAt;
    return msg;
  }

  async findById(id: string): Promise<Chat | null> {
    const orm = await this.chatRepo.findOne({ where: { id } });
    return orm ? this.toChatEntity(orm) : null;
  }

  async findByUserIdAndSubjectId(userId: string, subjectId?: string): Promise<Chat[]> {
    const where: Record<string, string> = { userId };
    if (subjectId) where.subjectId = subjectId;
    const orms = await this.chatRepo.find({
      where,
      order: { updatedAt: 'DESC' },
    });
    return orms.map((o) => this.toChatEntity(o));
  }

  async create(data: Partial<Chat>): Promise<Chat> {
    const orm = this.chatRepo.create({
      userId: data.userId,
      subjectId: data.subjectId,
      title: data.title ?? 'New conversation',
    });
    const saved = await this.chatRepo.save(orm);
    return this.toChatEntity(saved);
  }

  async delete(id: string): Promise<void> {
    await this.chatRepo.delete(id);
  }

  async findMessages(chatId: string): Promise<Message[]> {
    const orms = await this.messageRepo.find({
      where: { chatId },
      order: { createdAt: 'ASC' },
    });
    return orms.map((o) => this.toMessageEntity(o));
  }

  async updateTitle(id: string, title: string): Promise<void> {
    await this.chatRepo.update(id, { title });
  }

  async createMessage(data: Partial<Message>): Promise<Message> {
    const orm = this.messageRepo.create({
      chatId: data.chatId,
      role: data.role,
      content: data.content,
      sources: data.sources as object,
    });
    const saved = await this.messageRepo.save(orm);
    return this.toMessageEntity(saved);
  }
}
