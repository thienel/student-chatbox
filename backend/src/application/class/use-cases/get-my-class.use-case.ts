import { Injectable, Inject } from '@nestjs/common';
import { IClassRepository } from '../../../domain/class/repositories/class.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';

@Injectable()
export class GetMyClassUseCase {
  constructor(
    @Inject(TOKENS.CLASS_REPO) private readonly classRepo: IClassRepository,
  ) {}

  async execute(subjectId: string, studentId: string) {
    const c = await this.classRepo.findStudentClassInSubject(subjectId, studentId);
    if (!c) return null;
    return {
      id: c.id,
      subjectId: c.subjectId,
      lecturerId: c.lecturerId,
      name: c.name,
      lecturer: c.lecturer,
    };
  }
}
