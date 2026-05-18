import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { ISubjectRepository } from '../../../domain/subject/repositories/subject.repository.interface';
import { IUserRepository } from '../../../domain/user/repositories/user.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';

@Injectable()
export class AssignLecturerUseCase {
  constructor(
    @Inject(TOKENS.SUBJECT_REPO) private readonly subjectRepo: ISubjectRepository,
    @Inject(TOKENS.USER_REPO) private readonly userRepo: IUserRepository,
  ) {}

  async execute(subjectId: string, lecturerId: string, assignedBy: string): Promise<void> {
    const subject = await this.subjectRepo.findById(subjectId);
    if (!subject) throw new NotFoundException('Subject not found');

    const lecturer = await this.userRepo.findByIdWithPermissions(lecturerId);
    if (!lecturer) throw new NotFoundException('Lecturer not found');
    if (lecturer.roleName !== 'lecturer') throw new BadRequestException('User is not a lecturer');

    await this.subjectRepo.assignLecturer(subjectId, lecturerId, assignedBy);
  }
}
