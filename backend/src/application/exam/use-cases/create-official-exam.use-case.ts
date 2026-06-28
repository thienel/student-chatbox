import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IExamRepository } from '../../../domain/exam/repositories/exam.repository.interface';
import { ISubjectRepository } from '../../../domain/subject/repositories/subject.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { ClassContextService } from '../../class/services/class-context.service';
import { User } from '../../../domain/user/entities/user.entity';
import { CreateOfficialExamDto } from '../dtos/exam.dto';
import { validateOfficialQuestions } from './official-exam.helpers';

@Injectable()
export class CreateOfficialExamUseCase {
  constructor(
    @Inject(TOKENS.EXAM_REPO) private readonly examRepo: IExamRepository,
    @Inject(TOKENS.SUBJECT_REPO) private readonly subjectRepo: ISubjectRepository,
    private readonly classContext: ClassContextService,
  ) {}

  async execute(subjectId: string, dto: CreateOfficialExamDto, user: User) {
    const subject = await this.subjectRepo.findById(subjectId);
    if (!subject) throw new NotFoundException('Subject not found');

    // Lecturer must own the target class (admin may target any class in the subject).
    const classId = await this.classContext.resolveClassId(subjectId, user, dto.classId);

    validateOfficialQuestions(dto.questions);

    const exam = await this.examRepo.createExam({
      subjectId,
      classId,
      title: dto.title,
      description: dto.description,
      type: 'official',
      durationMinutes: dto.durationMinutes ?? 0,
      questionCount: dto.questions.length,
      isPublic: false,
      createdBy: user.id,
    });

    const questions = await this.examRepo.createQuestions(
      dto.questions.map((q, i) => ({
        examId: exam.id,
        content: q.content,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        topic: q.topic,
        position: i,
      })),
    );

    return { exam, questions };
  }
}
