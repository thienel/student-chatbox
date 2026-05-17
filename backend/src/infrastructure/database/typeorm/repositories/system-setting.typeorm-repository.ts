import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ISystemSettingRepository } from '../../../../domain/system/repositories/system-setting.repository.interface';
import { SystemSetting } from '../../../../domain/system/entities/system-setting.entity';
import { SystemSettingOrmEntity } from '../orm-entities/system-setting.orm-entity';

@Injectable()
export class SystemSettingTypeOrmRepository implements ISystemSettingRepository {
  constructor(
    @InjectRepository(SystemSettingOrmEntity)
    private readonly repo: Repository<SystemSettingOrmEntity>,
  ) {}

  private toEntity(orm: SystemSettingOrmEntity): SystemSetting {
    const setting = new SystemSetting();
    setting.key = orm.key;
    setting.value = orm.value;
    setting.description = orm.description;
    setting.updatedBy = orm.updatedBy;
    setting.updatedAt = orm.updatedAt;
    return setting;
  }

  async findAll(): Promise<SystemSetting[]> {
    const orms = await this.repo.find();
    return orms.map((o) => this.toEntity(o));
  }

  async findByKey(key: string): Promise<SystemSetting | null> {
    const orm = await this.repo.findOne({ where: { key } });
    return orm ? this.toEntity(orm) : null;
  }

  async upsert(key: string, value: unknown, updatedBy?: string): Promise<SystemSetting> {
    await this.repo.upsert(
      { key, value: value as object, updatedBy },
      { conflictPaths: ['key'], skipUpdateIfNoValuesChanged: false },
    );
    const orm = await this.repo.findOne({ where: { key } });
    return this.toEntity(orm!);
  }
}
