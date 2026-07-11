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

    const cls = await this.classRepo.findById(dto.classId);
    if (!cls || cls.subjectId !== subjectId) {
      throw new BadRequestException('Class not found in this subject');
    }

    if (!(await bcrypt.compare(dto.password, cls.passwordHash))) {
      throw new BadRequestException('Invalid class password');
    }

    await this.classRepo.enrollStudent(cls.id, studentId);
    return { classId: cls.id };
  }
}
