import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class RegisterStudentDto {
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
  @IsOptional()
  studentCode?: string;

  @IsString()
  @IsOptional()
  campus?: string;

  @IsString()
  @IsOptional()
  reasonForNoFptEmail?: string;

  @IsString()
  @IsOptional()
  studentCardUrl?: string;
}
