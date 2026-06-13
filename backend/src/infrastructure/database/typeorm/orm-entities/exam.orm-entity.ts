import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserOrmEntity } from './user.orm-entity';
import { SubjectOrmEntity } from './subject.orm-entity';
import { QuestionOrmEntity } from './question.orm-entity';

@Entity('exams')
export class ExamOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'subject_id' })
  subjectId: string;

  @Column({ name: 'class_id', type: 'uuid', nullable: true })
  classId: string;

  @Column({ length: 500 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ length: 30 })
  type: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  difficulty: string | null;

  @Column({ name: 'duration_minutes', default: 0 })
  durationMinutes: number;

  @Column({ name: 'question_count', default: 10 })
  questionCount: number;

  @Column({ name: 'is_public', default: false })
  isPublic: boolean;

  @Column({ name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => SubjectOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subject_id' })
  subject: SubjectOrmEntity;

  @ManyToOne(() => UserOrmEntity)
  @JoinColumn({ name: 'created_by' })
  creator: UserOrmEntity;

  @OneToMany(() => QuestionOrmEntity, (q) => q.exam, { cascade: true })
  questions: QuestionOrmEntity[];
}
