export class FlashcardSet {
  id: string;
  subjectId: string;
  classId?: string;
  title: string;
  description?: string;
  isPublic: boolean;
  starCount: number;
  clonedFromId?: string;
  publishedAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
