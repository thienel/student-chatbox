import { Injectable, Inject } from '@nestjs/common';
import { IClassRepository, IAvailableClass } from '../../../domain/class/repositories/class.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';

@Injectable()
export class ListAvailableClassesUseCase {
  constructor(
    @Inject(TOKENS.CLASS_REPO)
    private readonly classRepo: IClassRepository,
  ) {}

  async execute(subjectId: string): Promise<IAvailableClass[]> {
    return this.classRepo.listAvailableClasses(subjectId);
  }
}
