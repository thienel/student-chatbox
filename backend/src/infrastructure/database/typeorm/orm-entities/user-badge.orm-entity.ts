import {
  Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique,
} from 'typeorm';

@Entity('user_badges')
@Unique(['userId', 'badgeId'])
export class UserBadgeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'badge_id', type: 'varchar', length: 50 })
  badgeId: string;

  @CreateDateColumn({ name: 'awarded_at', type: 'timestamptz' })
  awardedAt: Date;
}
