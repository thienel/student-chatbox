import {
  Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique,
} from 'typeorm';

export type UpvoteTarget = 'question' | 'answer';

@Entity('board_upvotes')
@Unique(['userId', 'targetType', 'targetId'])
export class BoardUpvoteOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'target_type', type: 'varchar', length: 10 })
  targetType: UpvoteTarget;

  @Column({ name: 'target_id', type: 'uuid' })
  targetId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
