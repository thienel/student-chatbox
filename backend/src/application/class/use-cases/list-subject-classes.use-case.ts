import { Injectable, Inject } from '@nestjs/common';
import { IClassRepository } from '../../../domain/class/repositories/class.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { User } from '../../../domain/user/entities/user.entity';

@Injectable()
export class ListSubjectClassesUseCase {
  constructor(
    @Inject(TOKENS.CLASS_REPO) private readonly classRepo: IClassRepository,
  ) {}

  async execute(subjectId: string, user: User) {
    const classes = await this.classRepo.listBySubject(subjectId);
    // Lecturers only manage their own classes; admins see all.
    const visible =
      user.roleName === 'lecturer' ? classes.filter((c) => c.lecturerId === user.id) : classes;
    // Never expose the password hash.
    return visible.map((c) => ({
      id: c.id,
      subjectId: c.subjectId,
      lecturerId: c.lecturerId,
      name: c.name,
      lecturer: c.lecturer,
      studentCount: c.studentCount ?? 0,
      createdAt: c.createdAt,
    }));
  }
}
