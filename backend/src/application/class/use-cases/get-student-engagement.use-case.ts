import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IClassRepository } from '../../../domain/class/repositories/class.repository.interface';
import { IWeakTopicRepository } from '../../../domain/exam/repositories/weak-topic.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { ClassContextService } from '../services/class-context.service';
import { User } from '../../../domain/user/entities/user.entity';

@Injectable()
export class GetStudentEngagementUseCase {
  constructor(
    @Inject(TOKENS.CLASS_REPO) private readonly classRepo: IClassRepository,
    @Inject(TOKENS.WEAK_TOPIC_REPO) private readonly weakTopicRepo: IWeakTopicRepository,
    private readonly classContext: ClassContextService,
  ) {}

  async execute(subjectId: string, classId: string, studentId: string, user: User) {
    const resolved = await this.classContext.resolveClassId(subjectId, user, classId);

    const engagement = await this.classRepo.getClassEngagement(subjectId, resolved);
    const student = engagement.find((e) => e.userId === studentId);
    if (!student) throw new NotFoundException('Student not found in this class');

    const [examAttempts, weakTopics] = await Promise.all([
      this.classRepo.getStudentExamAttempts(subjectId, studentId),
      this.weakTopicRepo.findByUserSubject(studentId, subjectId),
    ]);

    return { ...student, examAttempts, weakTopics };
  }
}
