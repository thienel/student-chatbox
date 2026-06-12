import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IClassRepository } from '../../../domain/class/repositories/class.repository.interface';
import { ISubjectRepository } from '../../../domain/subject/repositories/subject.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { CreateClassDto } from '../dtos/class.dto';

@Injectable()
export class CreateClassUseCase {
  constructor(
    @Inject(TOKENS.CLASS_REPO) private readonly classRepo: IClassRepository,
    @Inject(TOKENS.SUBJECT_REPO) private readonly subjectRepo: ISubjectRepository,
  ) {}

  async execute(subjectId: string, dto: CreateClassDto, lecturerId: string) {
    const subject = await this.subjectRepo.findById(subjectId);
    if (!subject) throw new NotFoundException('Subject not found');

    // A lecturer cannot own two classes with the same password (keeps the
    // lecturer+password lookup used at enroll time unambiguous).
    const existing = await this.classRepo.listBySubjectAndLecturer(subjectId, lecturerId);
    for (const c of existing) {
      if (await bcrypt.compare(dto.password, c.passwordHash)) {
        throw new ConflictException('You already have a class with this password');
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const created = await this.classRepo.create({
      subjectId,
      lecturerId,
      name: dto.name,
      passwordHash,
    });
    return { id: created.id, subjectId, lecturerId, name: created.name, createdAt: created.createdAt };
  }
}
