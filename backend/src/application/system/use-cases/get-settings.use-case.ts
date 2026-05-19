import { Injectable, Inject } from '@nestjs/common';
import { ISystemSettingRepository } from '../../../domain/system/repositories/system-setting.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { SystemSetting } from '../../../domain/system/entities/system-setting.entity';

@Injectable()
export class GetSettingsUseCase {
  constructor(
    @Inject(TOKENS.SYSTEM_SETTING_REPO) private readonly settingRepo: ISystemSettingRepository,
  ) {}

  async execute(): Promise<SystemSetting[]> {
    return this.settingRepo.findAll();
  }
}
