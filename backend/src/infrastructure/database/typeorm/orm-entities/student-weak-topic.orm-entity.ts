import { Column, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';

export type TopicClassification = 'weak' | 'developing' | 'strong';

@Entity('student_weak_topics')
@Unique(['userId', 'subjectId', 'topic'])
export class StudentWeakTopicOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'subject_id', type: 'uuid' })
  subjectId: string;

  @Column({ type: 'varchar', length: 100 })
  topic: string;

  @Column({ type: 'varchar', length: 20 })
  classification: TopicClassification;

  @Column({ name: 'total_questions', type: 'int' })
  totalQuestions: number;

  @Column({ name: 'correct_count', type: 'int' })
  correctCount: number;

  @Column({ name: 'correct_rate', type: 'double precision' })
  correctRate: number;

  @Column({ name: 'last_updated_at', type: 'timestamptz' })
  lastUpdatedAt: Date;
}
