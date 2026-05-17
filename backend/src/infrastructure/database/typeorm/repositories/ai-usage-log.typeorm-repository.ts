import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { IAiUsageLogRepository } from '../../../../domain/system/repositories/ai-usage-log.repository.interface';
import { AiFeature, AiUsageLog } from '../../../../domain/system/entities/ai-usage-log.entity';
import { AiUsageLogOrmEntity } from '../orm-entities/ai-usage-log.orm-entity';

@Injectable()
export class AiUsageLogTypeOrmRepository implements IAiUsageLogRepository {
  constructor(
    @InjectRepository(AiUsageLogOrmEntity)
    private readonly repo: Repository<AiUsageLogOrmEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async getUsageCount(userId: string, feature: AiFeature, date: string): Promise<number> {
    const orm = await this.repo.findOne({
      where: { userId, feature, usedDate: date },
    });
    return orm?.count ?? 0;
  }

  async increment(userId: string, feature: AiFeature, date: string): Promise<void> {
    await this.dataSource.query(
      `INSERT INTO ai_usage_logs (user_id, feature, used_date, count)
       VALUES ($1, $2, $3, 1)
       ON CONFLICT (user_id, feature, used_date)
       DO UPDATE SET count = ai_usage_logs.count + 1`,
      [userId, feature, date],
    );
  }

  async findByUserAndDate(userId: string, date: string): Promise<AiUsageLog[]> {
    const orms = await this.repo.find({ where: { userId, usedDate: date } });
    return orms.map((o) => ({
      id: o.id,
      userId: o.userId,
      feature: o.feature as AiFeature,
      usedDate: o.usedDate,
      count: o.count,
    }));
  }
}
