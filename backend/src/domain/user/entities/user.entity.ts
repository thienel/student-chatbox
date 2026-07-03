export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

export class User {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  roleId: string;
  roleName?: string;
  permissions?: string[];
  status: UserStatus;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
