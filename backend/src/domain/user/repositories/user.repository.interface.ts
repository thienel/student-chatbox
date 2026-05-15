import { User, UserStatus } from '../entities/user.entity';

export interface ListUsersFilter {
  role?: string;
  status?: UserStatus;
  search?: string;
  page: number;
  limit: number;
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByIdWithPermissions(id: string): Promise<User | null>;
  findAll(filter: ListUsersFilter): Promise<{ items: User[]; total: number }>;
  create(user: Partial<User>): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User>;
  delete(id: string): Promise<void>;
}
