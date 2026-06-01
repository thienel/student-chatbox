import { IsString, IsOptional, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateChatDto {
  @IsString()
  subjectId: string;

  @IsOptional()
  @IsString()
  title?: string;
}

export class SendMessageDto {
  @IsString()
  content: string;
}

export class MessageSourceDto {
  @IsString()
  documentId: string;

  @IsString()
  originalName: string;

  @IsString()
  excerpt: string;

  @IsNumber()
  score: number;
}

export class SaveAssistantMessageDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageSourceDto)
  sources?: MessageSourceDto[];
}
