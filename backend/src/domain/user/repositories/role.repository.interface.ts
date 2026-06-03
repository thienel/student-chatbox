import { Role } from '../entities/role.entity';

export interface IRoleRepository {
  findById(id: string): Promise<Role | null>;
  findByName(name: string): Promise<Role | null>;
  findAll(): Promise<Role[]>;
  findByIdWithPermissions(id: string): Promise<Role | null>;
  create(name: string, description?: string): Promise<Role>;
  updatePermissions(roleId: string, permissionNames: string[]): Promise<Role>;
  findAllPermissions(): Promise<{ id: string; name: string; description: string }[]>;
}
