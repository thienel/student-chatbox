import { Bookmark, BookmarkResourceType } from '../entities/bookmark.entity';

export interface IBookmarkRepository {
  create(data: Partial<Bookmark>): Promise<Bookmark>;
  findById(id: string): Promise<Bookmark | null>;
  findByUserId(userId: string, resourceType?: BookmarkResourceType): Promise<Bookmark[]>;
  delete(id: string): Promise<void>;
}
