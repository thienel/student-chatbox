import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ISubjectRepository } from '../../../domain/subject/repositories/subject.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';

@Injectable()
export class DeleteSubjectUseCase {
  constructor(
    @Inject(TOKENS.SUBJECT_REPO) private readonly subjectRepo: ISubjectRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const subject = await this.subjectRepo.findById(id);
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }
    await this.subjectRepo.delete(id);
  }
}
