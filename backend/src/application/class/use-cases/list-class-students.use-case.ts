import { Injectable, Inject } from '@nestjs/common';
import { IClassRepository } from '../../../domain/class/repositories/class.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { ClassContextService } from '../services/class-context.service';
import { User } from '../../../domain/user/entities/user.entity';

@Injectable()
export class ListClassStudentsUseCase {
  constructor(
    @Inject(TOKENS.CLASS_REPO) private readonly classRepo: IClassRepository,
    private readonly classContext: ClassContextService,
  ) {}

  async execute(subjectId: string, classId: string, user: User) {
    // Validates the lecturer owns this class (admins are blocked by perms).
    const resolved = await this.classContext.resolveClassId(subjectId, user, classId);
    return this.classRepo.listStudents(resolved);
  }
}
