import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RoleOrmEntity } from './role.orm-entity';

@Entity('users')
export class UserOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({ name: 'full_name', length: 255 })
  fullName: string;

  @Column({ name: 'role_id' })
  roleId: string;

  @Column({ default: 'active', length: 50 })
  status: string;

  @ManyToOne(() => RoleOrmEntity, { eager: false })
  @JoinColumn({ name: 'role_id' })
  role: RoleOrmEntity;

  @Column({ name: 'student_code', nullable: true, length: 50, type: 'varchar' })
  studentCode?: string | null;

  @Column({ name: 'email_verified_at', nullable: true, type: 'timestamp' })
  emailVerifiedAt?: Date | null;

  @Column({ name: 'last_login_at', nullable: true, type: 'timestamp' })
  lastLoginAt?: Date | null;

  @Column({ name: 'created_by', nullable: true, type: 'uuid' })
  createdBy?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
