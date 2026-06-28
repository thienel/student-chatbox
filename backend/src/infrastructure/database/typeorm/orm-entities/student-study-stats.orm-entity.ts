import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('student_study_stats')
export class StudentStudyStatsOrmEntity {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'current_streak', type: 'int', default: 0 })
  currentStreak: number;

  @Column({ name: 'longest_streak', type: 'int', default: 0 })
  longestStreak: number;

  @Column({ name: 'total_sessions', type: 'int', default: 0 })
  totalSessions: number;

  @Column({ name: 'total_cards_reviewed', type: 'int', default: 0 })
  totalCardsReviewed: number;

  @Column({ name: 'last_studied_date', type: 'date', nullable: true })
  lastStudiedDate: string | null;

  @Column({ name: 'new_cards_studied_today', type: 'int', default: 0 })
  newCardsStudiedToday: number;

  @Column({ name: 'new_cards_today_date', type: 'date', nullable: true })
  newCardsTodayDate: string | null;
}
