import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IDocumentRepository } from '../../../../domain/document/repositories/document.repository.interface';
import { Document, DocumentStatus } from '../../../../domain/document/entities/document.entity';
import { DocumentOrmEntity } from '../orm-entities/document.orm-entity';

@Injectable()
export class DocumentTypeOrmRepository implements IDocumentRepository {
  constructor(
    @InjectRepository(DocumentOrmEntity)
    private readonly repo: Repository<DocumentOrmEntity>,
  ) {}

  private toEntity(orm: DocumentOrmEntity): Document {
    const doc = new Document();
    doc.id = orm.id;
    doc.subjectId = orm.subjectId;
    doc.originalName = orm.originalName;
    doc.storedPath = orm.storedPath;
    doc.mimeType = orm.mimeType;
    doc.fileSizeBytes = orm.fileSizeBytes;
    doc.status = orm.status as DocumentStatus;
    doc.chunkCount = orm.chunkCount;
    doc.errorMessage = orm.errorMessage;
    doc.uploadedBy = orm.uploadedBy;
    doc.createdAt = orm.createdAt;
    doc.updatedAt = orm.updatedAt;
    if (orm.uploader) {
      doc.uploadedByUser = { id: orm.uploader.id, fullName: orm.uploader.fullName };
    }
    return doc;
  }

  async findById(id: string): Promise<Document | null> {
    const orm = await this.repo.findOne({ where: { id }, relations: ['uploader'] });
    return orm ? this.toEntity(orm) : null;
  }

  async findBySubjectId(subjectId: string): Promise<Document[]> {
    const orms = await this.repo.find({
      where: { subjectId },
      relations: ['uploader'],
      order: { createdAt: 'DESC' },
    });
    return orms.map((o) => this.toEntity(o));
  }

  async create(data: Partial<Document>): Promise<Document> {
    const orm = this.repo.create({
      subjectId: data.subjectId,
      originalName: data.originalName,
      storedPath: data.storedPath,
      mimeType: data.mimeType,
      fileSizeBytes: data.fileSizeBytes,
      status: data.status ?? DocumentStatus.PROCESSING,
      uploadedBy: data.uploadedBy,
    });
    const saved = await this.repo.save(orm);
    return this.toEntity(saved);
  }

  async updateStatus(id: string, status: DocumentStatus, chunkCount?: number, errorMessage?: string): Promise<void> {
    const updateData: Partial<DocumentOrmEntity> = { status };
    if (chunkCount !== undefined) updateData.chunkCount = chunkCount;
    if (errorMessage !== undefined) updateData.errorMessage = errorMessage;
    await this.repo.update(id, updateData);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
