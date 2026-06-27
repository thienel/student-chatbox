import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ExamOrmEntity } from './exam.orm-entity';

@Entity('questions')
export class QuestionOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'exam_id' })
  examId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb' })
  options: object;

  @Column({ name: 'correct_answer', length: 5 })
  correctAnswer: string;

  @Column({ type: 'text', nullable: true })
  explanation: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  topic: string | null;

  @Column({ default: 0 })
  position: number;

  @ManyToOne(() => ExamOrmEntity, (e) => e.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exam_id' })
  exam: ExamOrmEntity;
}
