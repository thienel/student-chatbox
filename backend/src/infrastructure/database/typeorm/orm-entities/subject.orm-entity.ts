import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserOrmEntity } from './user.orm-entity';

@Entity('subjects')
export class SubjectOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 20 })
  code: string;

  @Column({ length: 255 })
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ default: 'active', length: 20 })
  status: string;

  @Column({ name: 'created_by', nullable: true, type: 'uuid' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToMany(() => UserOrmEntity, { eager: false })
  @JoinTable({
    name: 'subject_lecturers',
    joinColumn: { name: 'subject_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'lecturer_id', referencedColumnName: 'id' },
  })
  lecturers: UserOrmEntity[];

  @ManyToMany(() => UserOrmEntity, { eager: false })
  @JoinTable({
    name: 'subject_enrollments',
    joinColumn: { name: 'subject_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'student_id', referencedColumnName: 'id' },
  })
  students: UserOrmEntity[];
}
