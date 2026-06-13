import { IsString, IsOptional, IsInt, IsIn, Min, Max, IsObject, IsArray, IsUUID } from 'class-validator';

export class GenerateExamDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  questionCount?: number;

  @IsOptional()
  @IsIn(['easy', 'medium', 'hard'])
  difficulty?: 'easy' | 'medium' | 'hard';

  @IsOptional()
  @IsString()
  topic?: string;

  /** Lecturer/admin: the class the exam belongs to (students derive it from enrollment). */
  @IsOptional()
  @IsUUID()
  classId?: string;

  /** Restrict generation to these documents; empty = whole class. */
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  documentIds?: string[];
}

export class SubmitAttemptDto {
  @IsObject()
  answers: Record<string, string>;

  @IsIn(['save_progress', 'submit'])
  action: 'save_progress' | 'submit';

  @IsOptional()
  @IsInt()
  timeSpentSecs?: number;
}
