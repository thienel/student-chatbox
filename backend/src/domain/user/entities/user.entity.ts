export enum UserStatus {
  PENDING_EMAIL_VERIFICATION = 'pending_email_verification',
  PENDING_MANUAL_VERIFICATION = 'pending_manual_verification',
  ACTIVE = 'active',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

export class User {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  studentCode?: string | null;
  roleId: string;
  roleName?: string;
  permissions?: string[];
  status: UserStatus;
  emailVerifiedAt?: Date | null;
  lastLoginAt?: Date | null;
  metadata?: Record<string, any> | null;
  createdBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
