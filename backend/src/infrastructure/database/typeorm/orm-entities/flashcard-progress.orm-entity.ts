import { Column, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('flashcard_progress')
@Unique(['userId', 'flashcardId'])
export class FlashcardProgressOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'flashcard_id', type: 'uuid' })
  flashcardId: string;

  @Column({ type: 'double precision' })
  stability: number;

  @Column({ type: 'double precision' })
  difficulty: number;

  @Column({ type: 'int' })
  interval: number;

  @Column({ type: 'int', default: 0 })
  reps: number;

  @Column({ name: 'last_rating', type: 'smallint' })
  lastRating: number;

  @Column({ name: 'last_reviewed_at', type: 'timestamptz' })
  lastReviewedAt: Date;

  @Index()
  @Column({ name: 'next_review_at', type: 'timestamptz' })
  nextReviewAt: Date;
}
