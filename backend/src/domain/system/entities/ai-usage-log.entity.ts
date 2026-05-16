export type AiFeature = 'chat_rag' | 'generate_flashcard' | 'generate_exam';

export class AiUsageLog {
  id: string;
  userId: string;
  feature: AiFeature;
  usedDate: string;
  count: number;
}
