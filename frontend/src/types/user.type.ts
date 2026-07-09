export type UserStatus = 'pending_email_verification' | 'active' | 'pending_verification' | 'rejected' | 'suspended';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'lecturer' | 'student';
  status: UserStatus;
  permissions: string[];
  createdAt: string;

  // New Fields
  roleName?: string;
  studentCode?: string;
  emailVerifiedAt?: string;
  lastLoginAt?: string;
}

export interface CreateUserRequest { email: string; fullName: string; password?: string; roles?: string[] }