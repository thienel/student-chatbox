import { Injectable, Inject } from '@nestjs/common';
import { IClassRepository } from '../../../domain/class/repositories/class.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';

@Injectable()
export class UnenrollClassUseCase {
  constructor(
    @Inject(TOKENS.CLASS_REPO) private readonly classRepo: IClassRepository,
  ) {}

  async execute(subjectId: string, studentId: string): Promise<void> {
    await this.classRepo.unenrollStudentFromSubject(subjectId, studentId);
  }
}
