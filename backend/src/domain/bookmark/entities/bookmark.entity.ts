export type BookmarkResourceType = 'document' | 'flashcard_set' | 'exam' | 'message';

export class Bookmark {
  id: string;
  userId: string;
  resourceType: BookmarkResourceType;
  resourceId: string;
  note?: string;
  createdAt: Date;
}
