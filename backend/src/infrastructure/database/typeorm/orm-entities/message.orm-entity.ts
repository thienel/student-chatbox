import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChatOrmEntity } from './chat.orm-entity';

@Entity('messages')
export class MessageOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'chat_id' })
  chatId: string;

  @Column({ length: 20 })
  role: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ nullable: true, type: 'jsonb' })
  sources: object;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => ChatOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chat_id' })
  chat: ChatOrmEntity;
}
