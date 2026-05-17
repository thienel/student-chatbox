import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SubjectOrmEntity } from './subject.orm-entity';
import { UserOrmEntity } from './user.orm-entity';

@Entity('documents')
export class DocumentOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'subject_id' })
  subjectId: string;

  @Column({ name: 'original_name', length: 500 })
  originalName: string;

  @Column({ name: 'stored_path', length: 1000 })
  storedPath: string;

  @Column({ name: 'mime_type', length: 100 })
  mimeType: string;

  @Column({ name: 'file_size_bytes', nullable: true, type: 'integer' })
  fileSizeBytes: number;

  @Column({ default: 'processing', length: 20 })
  status: string;

  @Column({ name: 'chunk_count', default: 0 })
  chunkCount: number;

  @Column({ name: 'error_message', nullable: true, type: 'text' })
  errorMessage: string;

  @Column({ name: 'uploaded_by' })
  uploadedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => SubjectOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subject_id' })
  subject: SubjectOrmEntity;

  @ManyToOne(() => UserOrmEntity)
  @JoinColumn({ name: 'uploaded_by' })
  uploader: UserOrmEntity;
}
