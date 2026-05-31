import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IAuditLogRepository, ListAuditLogsFilter } from '../../../../domain/system/repositories/audit-log.repository.interface';
import { AuditLog } from '../../../../domain/system/entities/audit-log.entity';
import { AuditLogOrmEntity } from '../orm-entities/audit-log.orm-entity';

@Injectable()
export class AuditLogTypeOrmRepository implements IAuditLogRepository {
  constructor(
    @InjectRepository(AuditLogOrmEntity)
    private readonly repo: Repository<AuditLogOrmEntity>,
  ) {}

  private toEntity(orm: AuditLogOrmEntity): AuditLog {
    const log = new AuditLog();
    log.id = orm.id;
    log.userId = orm.userId;
    log.userEmail = orm.user?.email;
    log.userFullName = orm.user?.fullName;
    log.action = orm.action;
    log.resourceType = orm.resourceType;
    log.resourceId = orm.resourceId;
    log.details = orm.details as Record<string, unknown>;
    log.ipAddress = orm.ipAddress;
    log.createdAt = orm.createdAt;
    return log;
  }

  async create(data: Partial<AuditLog>): Promise<AuditLog> {
    const orm = this.repo.create({
      userId: data.userId,
      action: data.action,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      details: data.details as object,
      ipAddress: data.ipAddress,
    });
    const saved = await this.repo.save(orm);
    return this.toEntity(saved);
  }

  async findAll(filter: ListAuditLogsFilter): Promise<{ items: AuditLog[]; total: number }> {
    const qb = this.repo.createQueryBuilder('al').leftJoinAndSelect('al.user', 'user');

    if (filter.userId) {
      qb.andWhere('al.user_id = :userId', { userId: filter.userId });
    }
    if (filter.action) {
      qb.andWhere('al.action = :action', { action: filter.action });
    }
    if (filter.from) {
      qb.andWhere('al.created_at >= :from', { from: filter.from });
    }
    if (filter.to) {
      qb.andWhere('al.created_at <= :to', { to: filter.to });
    }

    qb.orderBy('al.created_at', 'DESC');

    const total = await qb.getCount();
    const items = await qb
      .skip((filter.page - 1) * filter.limit)
      .take(filter.limit)
      .getMany();

    return { items: items.map((o) => this.toEntity(o)), total };
  }
}
