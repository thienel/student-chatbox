import { IsString, IsOptional } from 'class-validator';

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
