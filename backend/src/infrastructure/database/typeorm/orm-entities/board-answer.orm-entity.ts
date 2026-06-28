import {
  Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne,
  PrimaryGeneratedColumn, Unique, UpdateDateColumn,
} from 'typeorm';
import { BoardQuestionOrmEntity } from './board-question.orm-entity';

@Entity('board_answers')
@Unique(['questionId', 'authorId'])
export class BoardAnswerOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'question_id', type: 'uuid' })
  questionId: string;

  @Column({ name: 'author_id', type: 'uuid' })
  authorId: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ name: 'is_pinned', type: 'boolean', default: false })
  isPinned: boolean;

  @Column({ name: 'upvote_count', type: 'int', default: 0 })
  upvoteCount: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => BoardQuestionOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: BoardQuestionOrmEntity;
}
