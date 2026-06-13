export class FlashcardSet {
  id: string;
  subjectId: string;
  classId?: string;
  title: string;
  description?: string;
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
