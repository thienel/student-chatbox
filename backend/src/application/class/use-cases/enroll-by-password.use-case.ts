import { Injectable, Inject, BadRequestException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IClassRepository } from '../../../domain/class/repositories/class.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { EnrollByPasswordDto } from '../dtos/class.dto';

@Injectable()
export class EnrollByPasswordUseCase {
  constructor(
    @Inject(TOKENS.CLASS_REPO) private readonly classRepo: IClassRepository,
  ) {}

  async execute(subjectId: string, dto: EnrollByPasswordDto, studentId: string) {
    // A student may only belong to one class per subject.
    const current = await this.classRepo.findStudentClassInSubject(subjectId, studentId);
    if (current) {
      throw new ConflictException('You are already enrolled in a class for this subject');
    }

    const candidates = await this.classRepo.listBySubjectAndLecturer(subjectId, dto.lecturerId);
    let target: { id: string } | undefined;
    for (const c of candidates) {
      if (await bcrypt.compare(dto.password, c.passwordHash)) {
        target = c;
        break;
      }
    }
    if (!target) {
      throw new BadRequestException('Invalid lecturer or class password');
    }

    await this.classRepo.enrollStudent(target.id, studentId);
    return { classId: target.id };
  }
}
