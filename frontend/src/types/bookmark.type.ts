export type BookmarkResourceType = 'document' | 'flashcard_set' | 'exam' | 'message';

export interface Bookmark {
  id: string;
  userId: string;
  resourceType: BookmarkResourceType;
  resourceId: string;
  note?: string;
  createdAt: string;
}

export interface AddBookmarkRequest { resourceType: string; resourceId: string; note?: string; }