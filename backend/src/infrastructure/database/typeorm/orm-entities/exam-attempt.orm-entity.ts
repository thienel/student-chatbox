import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ExamOrmEntity } from './exam.orm-entity';
import { UserOrmEntity } from './user.orm-entity';

@Entity('exam_attempts')
export class ExamAttemptOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'exam_id' })
  examId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'jsonb', nullable: true })
  answers: object | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  score: number | null;

  @Column({ name: 'total_questions', nullable: true })
  totalQuestions: number | null;

  @Column({ name: 'correct_count', nullable: true })
  correctCount: number | null;

  @Column({ length: 20, default: 'in_progress' })
  status: string;

  @CreateDateColumn({ name: 'started_at' })
  startedAt: Date;

  @Column({ name: 'completed_at', nullable: true, type: 'timestamptz' })
  completedAt: Date | null;

  @Column({ name: 'time_spent_secs', nullable: true })
  timeSpentSecs: number | null;

  @ManyToOne(() => ExamOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exam_id' })
  exam: ExamOrmEntity;

  @ManyToOne(() => UserOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserOrmEntity;
}
