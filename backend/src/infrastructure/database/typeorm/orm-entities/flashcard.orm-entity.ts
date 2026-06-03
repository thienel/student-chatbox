import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FlashcardSetOrmEntity } from './flashcard-set.orm-entity';

@Entity('flashcards')
export class FlashcardOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'set_id' })
  setId: string;

  @Column({ type: 'text' })
  front: string;

  @Column({ type: 'text' })
  back: string;

  @Column({ default: 0 })
  position: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => FlashcardSetOrmEntity, (s) => s.cards, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'set_id' })
  set: FlashcardSetOrmEntity;
}
