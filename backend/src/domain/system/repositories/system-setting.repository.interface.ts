import { SystemSetting } from '../entities/system-setting.entity';

export interface ISystemSettingRepository {
  findAll(): Promise<SystemSetting[]>;
  findByKey(key: string): Promise<SystemSetting | null>;
  upsert(key: string, value: unknown, updatedBy?: string): Promise<SystemSetting>;
}
