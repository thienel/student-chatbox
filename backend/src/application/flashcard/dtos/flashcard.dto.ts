import { IsString, IsOptional, IsInt, Min, Max, IsArray, IsUUID, IsBoolean } from 'class-validator';

export class GenerateFlashcardsDto {
  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  cardCount?: number;

  /** Lecturer/admin: the class the set belongs to (students derive it from enrollment). */
  @IsOptional()
  @IsUUID()
  classId?: string;

  /** Restrict generation to these documents; empty = whole class. */
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  documentIds?: string[];
}

export class SetVisibilityDto {
  @IsBoolean()
  isPublic: boolean;
}
