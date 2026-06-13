import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IChatRepository } from '../../../domain/chat/repositories/chat.repository.interface';
import { ISubjectRepository } from '../../../domain/subject/repositories/subject.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { CreateChatDto } from '../dtos/chat.dto';
import { Chat } from '../../../domain/chat/entities/chat.entity';
import { ClassContextService } from '../../class/services/class-context.service';
import { User } from '../../../domain/user/entities/user.entity';

@Injectable()
export class CreateChatUseCase {
  constructor(
    @Inject(TOKENS.CHAT_REPO) private readonly chatRepo: IChatRepository,
    @Inject(TOKENS.SUBJECT_REPO) private readonly subjectRepo: ISubjectRepository,
    private readonly classContext: ClassContextService,
  ) {}

  async execute(dto: CreateChatDto, user: User): Promise<Chat> {
    const subject = await this.subjectRepo.findById(dto.subjectId);
    if (!subject) throw new NotFoundException('Subject not found');

    const classId = await this.classContext.resolveClassId(dto.subjectId, user, dto.classId);

    return this.chatRepo.create({
      userId: user.id,
      subjectId: dto.subjectId,
      classId,
      title: dto.title ?? 'Cuộc trò chuyện mới',
    });
  }
}
