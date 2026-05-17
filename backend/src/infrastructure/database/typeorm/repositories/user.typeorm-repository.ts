import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { IUserRepository, ListUsersFilter } from '../../../../domain/user/repositories/user.repository.interface';
import { User, UserStatus } from '../../../../domain/user/entities/user.entity';
import { UserOrmEntity } from '../orm-entities/user.orm-entity';

@Injectable()
export class UserTypeOrmRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repo: Repository<UserOrmEntity>,
  ) {}

  private toEntity(orm: UserOrmEntity): User {
    const user = new User();
    user.id = orm.id;
    user.email = orm.email;
    user.passwordHash = orm.passwordHash;
    user.fullName = orm.fullName;
    user.roleId = orm.roleId;
    user.status = orm.status as UserStatus;
    user.createdBy = orm.createdBy;
    user.createdAt = orm.createdAt;
    user.updatedAt = orm.updatedAt;
    if (orm.role) {
      user.roleName = orm.role.name;
      if (orm.role.permissions) {
        user.permissions = orm.role.permissions.map((p) => p.name);
      }
    }
    return user;
  }

  async findById(id: string): Promise<User | null> {
    const orm = await this.repo.findOne({ where: { id } });
    return orm ? this.toEntity(orm) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const orm = await this.repo.findOne({ where: { email } });
    return orm ? this.toEntity(orm) : null;
  }

  async findByIdWithPermissions(id: string): Promise<User | null> {
    const orm = await this.repo.findOne({
      where: { id },
      relations: ['role', 'role.permissions'],
    });
    return orm ? this.toEntity(orm) : null;
  }

  async findAll(filter: ListUsersFilter): Promise<{ items: User[]; total: number }> {
    const qb = this.repo.createQueryBuilder('u')
      .leftJoinAndSelect('u.role', 'role')
      .leftJoinAndSelect('role.permissions', 'permissions');

    if (filter.status) {
      qb.andWhere('u.status = :status', { status: filter.status });
    }
    if (filter.search) {
      qb.andWhere('(u.full_name ILIKE :search OR u.email ILIKE :search)', {
        search: `%${filter.search}%`,
      });
    }
    if (filter.role) {
      qb.andWhere('role.name = :role', { role: filter.role });
    }

    const total = await qb.getCount();
    const items = await qb
      .skip((filter.page - 1) * filter.limit)
      .take(filter.limit)
      .getMany();

    return { items: items.map((o) => this.toEntity(o)), total };
  }

  async create(data: Partial<User>): Promise<User> {
    const orm = this.repo.create({
      email: data.email,
      passwordHash: data.passwordHash,
      fullName: data.fullName,
      roleId: data.roleId,
      status: data.status ?? UserStatus.ACTIVE,
      createdBy: data.createdBy,
    });
    const saved = await this.repo.save(orm);
    return this.toEntity(saved);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const updateData: Partial<UserOrmEntity> = {};
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.roleId !== undefined) updateData.roleId = data.roleId;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.passwordHash !== undefined) updateData.passwordHash = data.passwordHash;
    await this.repo.update(id, updateData);
    const updated = await this.repo.findOne({ where: { id }, relations: ['role', 'role.permissions'] });
    return this.toEntity(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
