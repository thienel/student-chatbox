import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('student_study_settings')
export class StudentStudySettingsOrmEntity {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'new_cards_per_day', type: 'int', default: 20 })
  newCardsPerDay: number;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
