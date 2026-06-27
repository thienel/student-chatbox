import { IsInt, IsUUID, Min, Max } from 'class-validator';

export class ReviewCardDto {
  @IsUUID()
  flashcardId: string;

  @IsInt()
  @Min(1)
  @Max(4)
  rating: number; // 1 again | 2 hard | 3 good | 4 easy
}

export class UpdateStudySettingsDto {
  @IsInt()
  @Min(1)
  @Max(100)
  newCardsPerDay: number;
}
