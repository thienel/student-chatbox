import { AiFeature, AiUsageLog } from '../entities/ai-usage-log.entity';

export interface IAiUsageLogRepository {
  getUsageCount(userId: string, feature: AiFeature, date: string): Promise<number>;
  increment(userId: string, feature: AiFeature, date: string): Promise<void>;
  findByUserAndDate(userId: string, date: string): Promise<AiUsageLog[]>;
}
