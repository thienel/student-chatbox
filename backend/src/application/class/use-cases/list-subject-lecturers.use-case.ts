import { Injectable, Inject } from '@nestjs/common';
import { IClassRepository } from '../../../domain/class/repositories/class.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';

@Injectable()
export class ListSubjectLecturersUseCase {
  constructor(
    @Inject(TOKENS.CLASS_REPO) private readonly classRepo: IClassRepository,
  ) {}

  /** Lecturers that have at least one class — used by students to pick before entering a password. */
  execute(subjectId: string) {
    return this.classRepo.listLecturersWithClasses(subjectId);
  }
}
