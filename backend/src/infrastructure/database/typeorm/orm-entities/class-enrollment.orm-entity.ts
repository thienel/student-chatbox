import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ClassOrmEntity } from './class.orm-entity';
import { UserOrmEntity } from './user.orm-entity';

@Entity('class_enrollments')
@Unique(['classId', 'studentId'])
export class ClassEnrollmentOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'class_id', type: 'uuid' })
  classId: string;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @CreateDateColumn({ name: 'enrolled_at' })
  enrolledAt: Date;

  @ManyToOne(() => ClassOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'class_id' })
  class: ClassOrmEntity;

  @ManyToOne(() => UserOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: UserOrmEntity;
}
