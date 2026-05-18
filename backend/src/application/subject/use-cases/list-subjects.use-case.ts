import { Injectable, Inject } from '@nestjs/common';
import { ISubjectRepository } from '../../../domain/subject/repositories/subject.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { ListSubjectsDto } from '../dtos/subject.dto';
import { Subject, SubjectStatus } from '../../../domain/subject/entities/subject.entity';
import { User } from '../../../domain/user/entities/user.entity';

@Injectable()
export class ListSubjectsUseCase {
  constructor(
    @Inject(TOKENS.SUBJECT_REPO) private readonly subjectRepo: ISubjectRepository,
  ) {}

  async execute(dto: ListSubjectsDto, currentUser: User): Promise<{ items: Subject[]; total: number }> {
    const filter: Parameters<ISubjectRepository['findAll']>[0] = {
      status: dto.status as SubjectStatus | undefined,
      search: dto.search,
      page: dto.page ?? 1,
      limit: dto.limit ?? 20,
    };

    if (currentUser.roleName === 'student') {
      // Students see only active subjects
      filter.status = SubjectStatus.ACTIVE;
      filter.studentId = currentUser.id;
    } else if (currentUser.roleName === 'lecturer') {
      // Lecturers see only their assigned subjects
      filter.lecturerId = currentUser.id;
    }
    // Admin sees all

    return this.subjectRepo.findAll(filter);
  }
}
