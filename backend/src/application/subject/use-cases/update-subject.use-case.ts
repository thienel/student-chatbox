import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ISubjectRepository } from '../../../domain/subject/repositories/subject.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { UpdateSubjectDto } from '../dtos/subject.dto';
import { Subject, SubjectStatus } from '../../../domain/subject/entities/subject.entity';

@Injectable()
export class UpdateSubjectUseCase {
  constructor(
    @Inject(TOKENS.SUBJECT_REPO) private readonly subjectRepo: ISubjectRepository,
  ) {}

  async execute(id: string, dto: UpdateSubjectDto): Promise<Subject> {
    const subject = await this.subjectRepo.findById(id);
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    return this.subjectRepo.update(id, {
      name: dto.name,
      description: dto.description,
      status: dto.status as SubjectStatus | undefined,
    });
  }
}
