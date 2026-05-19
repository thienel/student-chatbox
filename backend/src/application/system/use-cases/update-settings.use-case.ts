import { Injectable, Inject } from '@nestjs/common';
import { ISystemSettingRepository } from '../../../domain/system/repositories/system-setting.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { SystemSetting } from '../../../domain/system/entities/system-setting.entity';

@Injectable()
export class UpdateSettingsUseCase {
  constructor(
    @Inject(TOKENS.SYSTEM_SETTING_REPO) private readonly settingRepo: ISystemSettingRepository,
  ) {}

  async execute(updates: Record<string, unknown>, updatedBy: string): Promise<SystemSetting[]> {
    const results: SystemSetting[] = [];
    for (const [key, value] of Object.entries(updates)) {
      const updated = await this.settingRepo.upsert(key, value, updatedBy);
      results.push(updated);
    }
    return results;
  }
}
