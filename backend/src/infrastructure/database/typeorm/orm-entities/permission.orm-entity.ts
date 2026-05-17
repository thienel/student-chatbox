import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('permissions')
export class PermissionOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 100 })
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
