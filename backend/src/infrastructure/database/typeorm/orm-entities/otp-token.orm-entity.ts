import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('otp_tokens')
export class OtpTokenEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  @Index()
  userId?: string;

  @Column()
  @Index()
  email: string;

  // Stored in the existing `code` column for a backwards-compatible migration.
  // Its value is always a bcrypt hash, never the OTP itself.
  @Column({ name: 'code' })
  codeHash: string;

  @Column()
  type: string;

  @Column({ name: 'expires_at' })
  expiresAt: Date;

  @Column({ name: 'used_at', nullable: true })
  usedAt?: Date;

  @Column({ name: 'failed_attempts', type: 'int', default: 0 })
  failedAttempts: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
