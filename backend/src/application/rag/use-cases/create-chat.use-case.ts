import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IChatRepository } from '../../../domain/chat/repositories/chat.repository.interface';
import { ISubjectRepository } from '../../../domain/subject/repositories/subject.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { CreateChatDto } from '../dtos/chat.dto';
import { Chat } from '../../../domain/chat/entities/chat.entity';

@Injectable()
export class CreateChatUseCase {
  constructor(
    @Inject(TOKENS.CHAT_REPO) private readonly chatRepo: IChatRepository,
    @Inject(TOKENS.SUBJECT_REPO) private readonly subjectRepo: ISubjectRepository,
  ) {}

  async execute(dto: CreateChatDto, userId: string): Promise<Chat> {
    const subject = await this.subjectRepo.findById(dto.subjectId);
    if (!subject) throw new NotFoundException('Subject not found');

    return this.chatRepo.create({
      userId,
      subjectId: dto.subjectId,
      title: dto.title ?? 'Cuộc trò chuyện mới',
    });
  }
}
