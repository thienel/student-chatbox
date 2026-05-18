import { IsEmail, IsString, MinLength, IsIn } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  fullName: string;

  @IsString()
  @IsIn(['admin', 'lecturer', 'student'])
  role: string;

  @IsString()
  @MinLength(6)
  temporaryPassword: string;
}
