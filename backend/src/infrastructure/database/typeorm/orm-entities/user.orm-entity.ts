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

  @Column({ default: 'active', length: 20 })
  status: string;

  @Column({ name: 'created_by', nullable: true, type: 'uuid' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => RoleOrmEntity, { eager: false })
  @JoinColumn({ name: 'role_id' })
  role: RoleOrmEntity;
}
