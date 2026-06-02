import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IExamRepository } from '../../../domain/exam/repositories/exam.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';

@Injectable()
export class GetExamUseCase {
  constructor(
    @Inject(TOKENS.EXAM_REPO) private readonly examRepo: IExamRepository,
  ) {}

  async execute(examId: string) {
    const exam = await this.examRepo.findExamById(examId);
    if (!exam) throw new NotFoundException('Exam not found');
    return exam;
  }
}
