import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateClassDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  password: string;
}

export class EnrollByPasswordDto {
  @IsString()
  lecturerId: string;

  @IsString()
  @MinLength(1)
  password: string;
}
