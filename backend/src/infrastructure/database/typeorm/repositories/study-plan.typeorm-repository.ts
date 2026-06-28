import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IStudyPlanRepository, StudyPlan, StudyPlanData,
} from '../../../../domain/study/repositories/study-plan.repository.interface';
import { StudentStudyPlanOrmEntity } from '../orm-entities/student-study-plan.orm-entity';

@Injectable()
export class StudyPlanTypeOrmRepository implements IStudyPlanRepository {
  constructor(
    @InjectRepository(StudentStudyPlanOrmEntity)
    private readonly repo: Repository<StudentStudyPlanOrmEntity>,
  ) {}

  private toEntity(o: StudentStudyPlanOrmEntity): StudyPlan {
    return {
      id: o.id,
      userId: o.userId,
      weekStartDate: o.weekStartDate,
      planVersion: o.planVersion,
      planData: o.planData as StudyPlanData,
      generatedAt: o.generatedAt,
    };
  }

  async findByUserAndWeek(userId: string, weekStartDate: string): Promise<StudyPlan | null> {
    const o = await this.repo.findOne({ where: { userId, weekStartDate } });
    return o ? this.toEntity(o) : null;
  }

  async create(userId: string, weekStartDate: string, planData: StudyPlanData): Promise<StudyPlan> {
    const saved = await this.repo.save(
      this.repo.create({ userId, weekStartDate, planVersion: 1, planData }),
    );
    return this.toEntity(saved);
  }

  async findRecentByUser(userId: string, limit: number): Promise<StudyPlan[]> {
    const orms = await this.repo.find({
      where: { userId },
      order: { weekStartDate: 'DESC' },
      take: limit,
    });
    return orms.map((o) => this.toEntity(o));
  }
}
