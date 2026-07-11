export interface FlashcardSet {
  id: string;
  subjectId: string;
  title: string;
  description?: string;
  isPublic: boolean;
  starCount: number;
  clonedFromId?: string;
  publishedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Flashcard {
  id: string;
  setId: string;
  front: string;
  back: string;
  position: number;
  createdAt: string;
}

export interface FlashcardSetWithCards extends FlashcardSet {
  cards: Flashcard[];
}

export interface DiscoverSetItem {
  id: string;
  title: string;
  subjectName: string;
  creatorName: string;
  cardCount: number;
  starCount: number;
  isStarredByMe: boolean;
  publishedAt: string | null;
}

export interface DiscoverSetsResult {
  items: DiscoverSetItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface GenerateFlashcardsRequest { subjectId?: string; classId?: string; title?: string; count?: number; sourceMaterial?: string; topic?: string; cardCount?: number; documentIds?: string[]; }