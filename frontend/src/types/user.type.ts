export type UserStatus = 'pending_email_verification' | 'pending_manual_verification' | 'active' | 'rejected' | 'suspended';

export interface User {
  id: string;
  email: string;
  fullName: string;
  roleName: 'admin' | 'lecturer' | 'student';
  status: UserStatus;
  permissions: string[];
  createdAt: string;

  studentCode?: string;
  emailVerifiedAt?: string;
  lastLoginAt?: string;
}

export interface CreateUserRequest { email: string; fullName: string; password?: string; roles?: string[] }
