import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RoleOrmEntity } from './role.orm-entity';

export enum UserStatus {
  PENDING_EMAIL_VERIFICATION = 'pending_email_verification',
  PENDING_MANUAL_VERIFICATION = 'pending_manual_verification',
  ACTIVE = 'active',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

@Entity('users')
export class UserOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ name: 'password_hash', length: 255, select: false })
  passwordHash: string;

  @Column({ name: 'full_name', length: 255 })
  fullName: string;

  @Column({ name: 'role_id' })
  roleId: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: UserStatus.PENDING_EMAIL_VERIFICATION,
  })
  status: string; // Stored as string but maps to UserStatus

  @ManyToOne(() => RoleOrmEntity, { eager: false })
  @JoinColumn({ name: 'role_id' })
  role: RoleOrmEntity;

  @Column({ name: 'student_code', nullable: true, length: 50, type: 'varchar' })
  studentCode?: string | null;

  @Column({ name: 'email_verified_at', nullable: true, type: 'timestamp' })
  emailVerifiedAt?: Date | null;

  @Column({ name: 'last_login_at', nullable: true, type: 'timestamp' })
  lastLoginAt?: Date | null;

  @Column({ name: 'registration_source', nullable: true, type: 'varchar', length: 100 })
  registrationSource?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any> | null;

  @Column({ name: 'created_by', nullable: true, type: 'uuid' })
  createdBy?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  normalizeEmail() {
    if (this.email) {
      this.email = this.email.trim().toLowerCase();
    }
  }
}
