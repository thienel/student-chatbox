import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

export class CreateStudentVerificationRequestDto {
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  @MaxLength(255, { message: 'Full name cannot exceed 255 characters' })
  fullName: string;

  @IsString()
  @IsNotEmpty({ message: 'Student code is required' })
  studentCode: string;

  @IsString()
  @IsOptional()
  campus?: string;

  @IsEmail({}, { message: 'Personal email must be a valid email address' })
  @IsNotEmpty({ message: 'Personal email is required' })
  personalEmail: string;

}
