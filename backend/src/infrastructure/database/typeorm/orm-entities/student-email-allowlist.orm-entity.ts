import {
  BeforeInsert,
  BeforeUpdate,
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

export enum EmailAllowlistStatus {
  AVAILABLE = 'available',
  CLAIMED = 'claimed',
  EXPIRED = 'expired',
  DISABLED = 'disabled',
}

@Entity('student_email_allowlist')
@Index('idx_student_email_allowlist_email', ['email'])
@Index('idx_student_email_allowlist_student_code', ['studentCode'])
@Index('idx_student_email_allowlist_status', ['status'])
@Index('uq_student_email_allowlist_email_student_code', ['email', 'studentCode'], {
  unique: true,
})
export class StudentEmailAllowlistOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ name: 'student_code', type: 'varchar', length: 50 })
  studentCode: string;

  @Column({ name: 'full_name', type: 'varchar', length: 255, nullable: true })
  fullName?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  campus?: string | null;

  @Column({
    type: 'enum',
    enum: EmailAllowlistStatus,
    default: EmailAllowlistStatus.AVAILABLE,
  })
  status: EmailAllowlistStatus;

  @Column({ type: 'varchar', length: 100, default: 'admin' })
  source: string;

  @Column({ name: 'claimed_by_user_id', type: 'uuid', nullable: true })
  claimedByUserId?: string | null;

  @ManyToOne(() => UserOrmEntity, {
    eager: false,
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'claimed_by_user_id' })
  claimedByUser?: UserOrmEntity | null;

  @Column({ name: 'claimed_at', type: 'timestamp', nullable: true })
  claimedAt?: Date | null;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt?: Date | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  normalizeFields() {
    if (this.email) {
      this.email = this.email.trim().toLowerCase();
    }

    if (this.studentCode) {
      this.studentCode = this.studentCode.trim().toUpperCase();
    }
  }
}
