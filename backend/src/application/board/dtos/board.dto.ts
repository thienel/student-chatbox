import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  body: string;
}

export class UpdateQuestionDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  body?: string;
}

export class CreateAnswerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  body: string;
}

export class UpdateAnswerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  body: string;
}
