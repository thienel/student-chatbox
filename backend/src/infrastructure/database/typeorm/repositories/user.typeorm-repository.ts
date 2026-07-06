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
    user.studentCode = orm.studentCode;
    user.emailVerifiedAt = orm.emailVerifiedAt;
    user.lastLoginAt = orm.lastLoginAt;
    user.registrationSource = orm.registrationSource;
    user.metadata = orm.metadata;
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
    const orm = await this.repo.createQueryBuilder('user')
      .where('user.email = :email', { email })
      .addSelect('user.passwordHash')
      .getOne();
    return orm ? this.toEntity(orm) : null;
  }

  async findByEmailWithPermissions(email: string): Promise<User | null> {
    const orm = await this.repo.createQueryBuilder('user')
      .where('user.email = :email', { email })
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('role.permissions', 'permissions')
      .addSelect('user.passwordHash')
      .getOne();
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
    const orm = new UserOrmEntity();
    if (data.email !== undefined) orm.email = data.email;
    if (data.passwordHash !== undefined) orm.passwordHash = data.passwordHash;
    if (data.fullName !== undefined) orm.fullName = data.fullName;
    if (data.roleId !== undefined) orm.roleId = data.roleId;
    orm.status = data.status ?? UserStatus.PENDING_EMAIL_VERIFICATION;
    if (data.createdBy !== undefined) orm.createdBy = data.createdBy;
    if (data.studentCode !== undefined) orm.studentCode = data.studentCode;
    if (data.emailVerifiedAt !== undefined) orm.emailVerifiedAt = data.emailVerifiedAt;
    if (data.lastLoginAt !== undefined) orm.lastLoginAt = data.lastLoginAt;
    if (data.registrationSource !== undefined) orm.registrationSource = data.registrationSource;
    if (data.metadata !== undefined) orm.metadata = data.metadata;
    const saved = await this.repo.save(orm);
    return this.toEntity(saved);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const updateData: Partial<UserOrmEntity> = {};
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.roleId !== undefined) updateData.roleId = data.roleId;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.passwordHash !== undefined) updateData.passwordHash = data.passwordHash;
    if (data.studentCode !== undefined) updateData.studentCode = data.studentCode;
    if (data.emailVerifiedAt !== undefined) updateData.emailVerifiedAt = data.emailVerifiedAt;
    if (data.lastLoginAt !== undefined) updateData.lastLoginAt = data.lastLoginAt;
    if (data.registrationSource !== undefined) updateData.registrationSource = data.registrationSource;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;
    await this.repo.update(id, updateData);
    const updated = await this.repo.findOne({ where: { id }, relations: ['role', 'role.permissions'] });
    return this.toEntity(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
