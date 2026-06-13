import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserOrmEntity } from './user.orm-entity';
import { SubjectOrmEntity } from './subject.orm-entity';
import { FlashcardOrmEntity } from './flashcard.orm-entity';

@Entity('flashcard_sets')
export class FlashcardSetOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'subject_id' })
  subjectId: string;

  @Column({ name: 'class_id', type: 'uuid', nullable: true })
  classId: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'is_public', default: true })
  isPublic: boolean;

  @Column({ name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => SubjectOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subject_id' })
  subject: SubjectOrmEntity;

  @ManyToOne(() => UserOrmEntity)
  @JoinColumn({ name: 'created_by' })
  creator: UserOrmEntity;

  @OneToMany(() => FlashcardOrmEntity, (f) => f.set, { cascade: true })
  cards: FlashcardOrmEntity[];
}
