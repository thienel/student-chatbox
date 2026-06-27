import { Injectable, Inject } from '@nestjs/common';
import { IStudyPlanRepository } from '../../../domain/study/repositories/study-plan.repository.interface';
import { IStudyRepository } from '../../../domain/study/repositories/study.repository.interface';
import { IWeakTopicRepository } from '../../../domain/exam/repositories/weak-topic.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { User } from '../../../domain/user/entities/user.entity';
import { ictWeekStartMonday } from '../../../shared/utils/ict-time';
import { buildStudyPlan } from '../../../domain/study/services/study-plan-builder';

@Injectable()
export class GetCurrentStudyPlanUseCase {
  constructor(
    @Inject(TOKENS.STUDY_PLAN_REPO) private readonly planRepo: IStudyPlanRepository,
    @Inject(TOKENS.STUDY_REPO) private readonly studyRepo: IStudyRepository,
    @Inject(TOKENS.WEAK_TOPIC_REPO) private readonly weakTopicRepo: IWeakTopicRepository,
  ) {}

  async execute(user: User) {
    const weekStart = ictWeekStartMonday();

    const existing = await this.planRepo.findByUserAndWeek(user.id, weekStart);
    if (existing) return existing;

    // Lazily generate this week's plan from the student's current state.
    const [dueCardCount, weakTopics] = await Promise.all([
      this.studyRepo.countDueCards(user.id),
      this.weakTopicRepo.findAllByUser(user.id),
    ]);

    const planData = buildStudyPlan({
      weekStart,
      dueCardCount,
      weakTopics: weakTopics
        .filter((t) => t.classification === 'weak')
        .map((t) => ({ subjectId: t.subjectId, topic: t.topic, correctRate: t.correctRate })),
    });

    return this.planRepo.create(user.id, weekStart, planData);
  }
}
