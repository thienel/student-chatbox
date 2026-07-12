import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/** Per-session state: it deliberately does not leak into later study sessions. */
@Entity('flashcard_session_lapses')
@Index(['sessionId', 'flashcardId'], { unique: true })
export class FlashcardSessionLapseOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @Column({ name: 'flashcard_id', type: 'uuid' })
  flashcardId: string;

  @Column({ name: 'lapse_count', type: 'int', default: 0 })
  lapseCount: number;
}
