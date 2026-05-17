import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserOrmEntity } from './user.orm-entity';

@Entity('audit_logs')
export class AuditLogOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true, type: 'uuid' })
  userId: string;

  @Column({ length: 100 })
  action: string;

  @Column({ name: 'resource_type', nullable: true, length: 50 })
  resourceType: string;

  @Column({ name: 'resource_id', nullable: true, type: 'uuid' })
  resourceId: string;

  @Column({ nullable: true, type: 'jsonb' })
  details: object;

  @Column({ name: 'ip_address', nullable: true, type: 'inet' })
  ipAddress: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => UserOrmEntity, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: UserOrmEntity;
}
