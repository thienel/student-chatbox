import { IsString, IsOptional, IsInt, IsIn, Min, Max, IsObject } from 'class-validator';

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
