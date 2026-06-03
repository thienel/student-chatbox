import {
  Column, CreateDateColumn, Entity, JoinColumn,
  ManyToOne, PrimaryGeneratedColumn, Unique,
} from 'typeorm';
import { UserOrmEntity } from './user.orm-entity';

@Entity('bookmarks')
@Unique(['userId', 'resourceType', 'resourceId'])
export class BookmarkOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'resource_type', length: 30 })
  resourceType: string;

  @Column({ name: 'resource_id' })
  resourceId: string;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => UserOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserOrmEntity;
}
