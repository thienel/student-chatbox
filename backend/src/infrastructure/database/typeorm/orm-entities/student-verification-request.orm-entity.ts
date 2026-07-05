import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserOrmEntity } from './user.orm-entity';

export enum VerificationRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  NEED_MORE_INFO = 'need_more_info',
}

@Entity('student_verification_requests')
@Index('idx_student_verification_user_id', ['userId'])
@Index('idx_student_verification_status', ['status'])
@Index('idx_student_verification_student_code', ['studentCode'])
export class StudentVerificationRequestOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserOrmEntity, {
    eager: false,
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserOrmEntity;

  @Column({ name: 'student_code', length: 50 })
  studentCode: string;

  @Column({ length: 100, nullable: true, type: 'varchar' })
  campus?: string | null;

  @Column({ name: 'personal_email', length: 255 })
  personalEmail: string;


  @Column({
    type: 'enum',
    enum: VerificationRequestStatus,
    default: VerificationRequestStatus.PENDING,
  })
  status: VerificationRequestStatus;

  @Column({ name: 'reviewed_by', type: 'uuid', nullable: true })
  reviewedBy?: string | null;

  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewedAt?: Date | null;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
