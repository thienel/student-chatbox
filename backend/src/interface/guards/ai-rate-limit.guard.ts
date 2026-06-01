import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IAiUsageLogRepository } from '../../domain/system/repositories/ai-usage-log.repository.interface';
import { ISystemSettingRepository } from '../../domain/system/repositories/system-setting.repository.interface';
import { TOKENS } from '../../shared/constants/tokens';
import { AI_FEATURE_KEY } from '../decorators/ai-feature.decorator';

@Injectable()
export class AiRateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(TOKENS.AI_USAGE_LOG_REPO)
    private readonly usageLogRepo: IAiUsageLogRepository,
    @Inject(TOKENS.SYSTEM_SETTING_REPO)
    private readonly settingRepo: ISystemSettingRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return false;

    const feature =
      this.reflector.get<string>(AI_FEATURE_KEY, context.getHandler()) ?? 'chat_rag';

    const role = user.role;
    const settingKey = `ai_daily_limit.${role}.${feature}`;
    const setting = await this.settingRepo.findByKey(settingKey);
    const limit = setting ? Number(setting.value) : 20;

    if (limit === -1) return true;

    const today = new Date().toISOString().split('T')[0];
    const used = await this.usageLogRepo.getUsageCount(user.id, feature, today);

    if (used >= limit) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      throw new HttpException(
        {
          success: false,
          error: {
            code: 'AI_RATE_LIMIT_EXCEEDED',
            message: `Bạn đã sử dụng hết ${limit} lượt ${feature} hôm nay. Hạn mức sẽ được đặt lại vào 00:00 ngày mai.`,
            data: { limit, used, resetsAt: tomorrow.toISOString() },
          },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
