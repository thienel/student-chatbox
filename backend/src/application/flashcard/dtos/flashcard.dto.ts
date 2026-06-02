import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';

export class GenerateFlashcardsDto {
  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  cardCount?: number;
}
