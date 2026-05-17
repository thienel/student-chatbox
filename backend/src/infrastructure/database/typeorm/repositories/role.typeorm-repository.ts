import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IRoleRepository } from '../../../../domain/user/repositories/role.repository.interface';
import { Role } from '../../../../domain/user/entities/role.entity';
import { RoleOrmEntity } from '../orm-entities/role.orm-entity';

@Injectable()
export class RoleTypeOrmRepository implements IRoleRepository {
  constructor(
    @InjectRepository(RoleOrmEntity)
    private readonly repo: Repository<RoleOrmEntity>,
  ) {}

  private toEntity(orm: RoleOrmEntity): Role {
    const role = new Role();
    role.id = orm.id;
    role.name = orm.name;
    role.description = orm.description;
    role.isSystem = orm.isSystem;
    role.createdAt = orm.createdAt;
    if (orm.permissions) {
      role.permissions = orm.permissions.map((p) => p.name);
    }
    return role;
  }

  async findById(id: string): Promise<Role | null> {
    const orm = await this.repo.findOne({ where: { id } });
    return orm ? this.toEntity(orm) : null;
  }

  async findByName(name: string): Promise<Role | null> {
    const orm = await this.repo.findOne({ where: { name } });
    return orm ? this.toEntity(orm) : null;
  }

  async findAll(): Promise<Role[]> {
    const orms = await this.repo.find({ relations: ['permissions'] });
    return orms.map((o) => this.toEntity(o));
  }

  async findByIdWithPermissions(id: string): Promise<Role | null> {
    const orm = await this.repo.findOne({
      where: { id },
      relations: ['permissions'],
    });
    return orm ? this.toEntity(orm) : null;
  }
}
