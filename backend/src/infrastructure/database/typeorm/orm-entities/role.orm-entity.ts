import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  JoinTable,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PermissionOrmEntity } from './permission.orm-entity';

@Entity('roles')
export class RoleOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ name: 'is_system', default: false })
  isSystem: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToMany(() => PermissionOrmEntity, { eager: false })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: PermissionOrmEntity[];
}
