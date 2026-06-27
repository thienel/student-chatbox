import {
  Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn,
} from 'typeorm';

export type StudySessionStatus = 'active' | 'completed' | 'abandoned';

@Entity('flashcard_study_sessions')
@Index(['userId', 'flashcardSetId', 'status'])
export class FlashcardStudySessionOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'flashcard_set_id', type: 'uuid' })
  flashcardSetId: string;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: StudySessionStatus;

  @Column({ name: 'cards_studied', type: 'int', default: 0 })
  cardsStudied: number;

  @Column({ name: 'cards_again', type: 'int', default: 0 })
  cardsAgain: number;

  @Column({ name: 'cards_hard', type: 'int', default: 0 })
  cardsHard: number;

  @Column({ name: 'cards_good', type: 'int', default: 0 })
  cardsGood: number;

  @Column({ name: 'cards_easy', type: 'int', default: 0 })
  cardsEasy: number;

  @CreateDateColumn({ name: 'started_at', type: 'timestamptz' })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;
}
