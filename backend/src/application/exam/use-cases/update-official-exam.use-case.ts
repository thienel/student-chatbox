import {
  Injectable, Inject, NotFoundException, ForbiddenException, ConflictException, BadRequestException,
} from '@nestjs/common';
import { IExamRepository } from '../../../domain/exam/repositories/exam.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { User } from '../../../domain/user/entities/user.entity';
import { UpdateOfficialExamDto } from '../dtos/exam.dto';
import { validateOfficialQuestions } from './official-exam.helpers';

@Injectable()
export class UpdateOfficialExamUseCase {
  constructor(
    @Inject(TOKENS.EXAM_REPO) private readonly examRepo: IExamRepository,
  ) {}

  async execute(subjectId: string, examId: string, dto: UpdateOfficialExamDto, user: User) {
    const exam = await this.examRepo.findExamById(examId);
    if (!exam || exam.subjectId !== subjectId) {
      throw new NotFoundException('Exam not found');
    }
    if (exam.type !== 'official') {
      throw new BadRequestException('Only official exams can be edited');
    }
    if (user.roleName !== 'admin' && exam.createdBy !== user.id) {
      throw new ForbiddenException('You can only edit exams you created');
    }

    if (dto.questions) {
      validateOfficialQuestions(dto.questions);
    }

    const result = await this.examRepo.updateOfficialExamIfUnattempted(examId, {
      title: dto.title,
      description: dto.description,
      durationMinutes: dto.durationMinutes,
      questionCount: dto.questions ? dto.questions.length : undefined,
    }, dto.questions?.map((q, i) => (
      {
        content: q.content,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        topic: q.topic,
        position: i,
      }
    )));
    if (!result) {
      throw new ConflictException('Exam is locked: students have already attempted it');
    }
    return result;
  }
}
