import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IBookmarkRepository } from '../../../../domain/bookmark/repositories/bookmark.repository.interface';
import { Bookmark, BookmarkResourceType } from '../../../../domain/bookmark/entities/bookmark.entity';
import { BookmarkOrmEntity } from '../orm-entities/bookmark.orm-entity';

@Injectable()
export class BookmarkTypeOrmRepository implements IBookmarkRepository {
  constructor(
    @InjectRepository(BookmarkOrmEntity)
    private readonly repo: Repository<BookmarkOrmEntity>,
  ) {}

  private toEntity(o: BookmarkOrmEntity): Bookmark {
    const b = new Bookmark();
    b.id = o.id; b.userId = o.userId;
    b.resourceType = o.resourceType as BookmarkResourceType;
    b.resourceId = o.resourceId;
    b.note = o.note ?? undefined;
    b.createdAt = o.createdAt;
    return b;
  }

  async create(data: Partial<Bookmark>): Promise<Bookmark> {
    const saved = await this.repo.save(this.repo.create({
      userId: data.userId, resourceType: data.resourceType,
      resourceId: data.resourceId, note: data.note ?? null,
    }));
    return this.toEntity(saved);
  }

  async findById(id: string): Promise<Bookmark | null> {
    const o = await this.repo.findOne({ where: { id } });
    return o ? this.toEntity(o) : null;
  }

  async findByUserId(userId: string, resourceType?: BookmarkResourceType): Promise<Bookmark[]> {
    const where: Record<string, string> = { userId };
    if (resourceType) where.resourceType = resourceType;
    const orms = await this.repo.find({ where, order: { createdAt: 'DESC' } });
    return orms.map((o) => this.toEntity(o));
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
