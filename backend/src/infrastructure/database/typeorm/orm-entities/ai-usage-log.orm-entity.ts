import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { UserOrmEntity } from './user.orm-entity';

@Entity('ai_usage_logs')
@Unique(['userId', 'feature', 'usedDate'])
export class AiUsageLogOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ length: 30 })
  feature: string;

  @Column({ name: 'used_date', type: 'date' })
  usedDate: string;

  @Column({ default: 1 })
  count: number;

  @ManyToOne(() => UserOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserOrmEntity;
}
