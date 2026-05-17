import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('system_settings')
export class SystemSettingOrmEntity {
  @PrimaryColumn({ length: 100 })
  key: string;

  @Column({ type: 'jsonb' })
  value: unknown;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ name: 'updated_by', nullable: true, type: 'uuid' })
  updatedBy: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
