import {
  IsString, IsOptional, IsInt, IsIn, Min, Max, IsObject, IsArray, IsUUID,
  IsNotEmpty, MaxLength, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

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

export class QuestionOptionDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  text: string;
}

export class OfficialQuestionDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options: QuestionOptionDto[];

  @IsString()
  @IsNotEmpty()
  correctAnswer: string;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  topic?: string;
}

export class CreateOfficialExamDto {
  @IsUUID()
  classId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationMinutes?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OfficialQuestionDto)
  questions: OfficialQuestionDto[];
}

export class UpdateOfficialExamDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationMinutes?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OfficialQuestionDto)
  questions?: OfficialQuestionDto[];
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
