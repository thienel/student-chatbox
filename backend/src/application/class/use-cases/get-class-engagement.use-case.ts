import { Injectable, Inject } from '@nestjs/common';
import { IClassRepository } from '../../../domain/class/repositories/class.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { ClassContextService } from '../services/class-context.service';
import { User } from '../../../domain/user/entities/user.entity';

@Injectable()
export class GetClassEngagementUseCase {
  constructor(
    @Inject(TOKENS.CLASS_REPO) private readonly classRepo: IClassRepository,
    private readonly classContext: ClassContextService,
  ) {}

  async execute(subjectId: string, classId: string, user: User) {
    const resolved = await this.classContext.resolveClassId(subjectId, user, classId);
    const items = await this.classRepo.getClassEngagement(subjectId, resolved);
    return { items, total: items.length };
  }
}
