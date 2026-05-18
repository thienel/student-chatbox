import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ISubjectRepository } from '../../../domain/subject/repositories/subject.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';

@Injectable()
export class EnrollStudentUseCase {
  constructor(
    @Inject(TOKENS.SUBJECT_REPO) private readonly subjectRepo: ISubjectRepository,
  ) {}

  async execute(subjectId: string, studentId: string): Promise<void> {
    const subject = await this.subjectRepo.findById(subjectId);
    if (!subject) throw new NotFoundException('Subject not found');
    await this.subjectRepo.enrollStudent(subjectId, studentId);
  }
}
