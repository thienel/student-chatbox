import { IsString, IsIn, IsOptional, IsUUID } from 'class-validator';

export class AddBookmarkDto {
  @IsIn(['document', 'flashcard_set', 'exam', 'message'])
  resourceType: 'document' | 'flashcard_set' | 'exam' | 'message';

  @IsUUID()
  resourceId: string;

  @IsOptional()
  @IsString()
  note?: string;
}
