import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { UserOrmEntity } from './user.orm-entity';
import { FlashcardSetOrmEntity } from './flashcard-set.orm-entity';

@Entity('flashcard_set_stars')
@Unique(['setId', 'userId'])
export class FlashcardSetStarOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'set_id', type: 'uuid' })
  setId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => FlashcardSetOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'set_id' })
  set: FlashcardSetOrmEntity;

  @ManyToOne(() => UserOrmEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserOrmEntity;
}
