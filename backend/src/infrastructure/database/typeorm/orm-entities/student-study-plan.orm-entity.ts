import {
  Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique,
} from 'typeorm';

@Entity('student_study_plans')
@Unique(['userId', 'weekStartDate'])
export class StudentStudyPlanOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'week_start_date', type: 'date' })
  weekStartDate: string;

  @Column({ name: 'plan_version', type: 'int', default: 1 })
  planVersion: number;

  @Column({ name: 'plan_data', type: 'jsonb' })
  planData: unknown;

  @CreateDateColumn({ name: 'generated_at', type: 'timestamptz' })
  generatedAt: Date;
}
