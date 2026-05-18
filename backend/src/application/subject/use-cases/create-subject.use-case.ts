import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { ISubjectRepository } from '../../../domain/subject/repositories/subject.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { CreateSubjectDto } from '../dtos/subject.dto';
import { Subject } from '../../../domain/subject/entities/subject.entity';

@Injectable()
export class CreateSubjectUseCase {
  constructor(
    @Inject(TOKENS.SUBJECT_REPO) private readonly subjectRepo: ISubjectRepository,
  ) {}

  async execute(dto: CreateSubjectDto, createdBy: string): Promise<Subject> {
    const existing = await this.subjectRepo.findByCode(dto.code);
    if (existing) {
      throw new ConflictException(`Subject code '${dto.code}' already exists`);
    }

    return this.subjectRepo.create({
      code: dto.code,
      name: dto.name,
      description: dto.description,
      createdBy,
    });
  }
}
