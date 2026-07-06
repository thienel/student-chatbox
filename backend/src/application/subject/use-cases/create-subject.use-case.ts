import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { ISubjectRepository } from '../../../domain/subject/repositories/subject.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { CreateSubjectDto } from '../dtos/subject.dto';
import { Subject } from '../../../domain/subject/entities/subject.entity';
import { User } from '../../../domain/user/entities/user.entity';

@Injectable()
export class CreateSubjectUseCase {
  constructor(
    @Inject(TOKENS.SUBJECT_REPO) private readonly subjectRepo: ISubjectRepository,
  ) { }

  async execute(dto: CreateSubjectDto, creator: User): Promise<Subject> {
    const existing = await this.subjectRepo.findByCode(dto.code);
    if (existing) {
      throw new ConflictException(`Subject code '${dto.code}' already exists`);
    }

    const subject = await this.subjectRepo.create({
      code: dto.code,
      name: dto.name,
      description: dto.description,
      createdBy: creator.id,
    });

    if (creator.roleName === 'lecturer') {
      await this.subjectRepo.assignLecturer(subject.id, creator.id, creator.id);
    }

    return subject;
  }
}
