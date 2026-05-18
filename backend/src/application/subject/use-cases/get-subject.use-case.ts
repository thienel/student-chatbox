import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ISubjectRepository } from '../../../domain/subject/repositories/subject.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { Subject } from '../../../domain/subject/entities/subject.entity';

@Injectable()
export class GetSubjectUseCase {
  constructor(
    @Inject(TOKENS.SUBJECT_REPO) private readonly subjectRepo: ISubjectRepository,
  ) {}

  async execute(id: string): Promise<Subject> {
    const subject = await this.subjectRepo.findById(id);
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }
    return subject;
  }
}
