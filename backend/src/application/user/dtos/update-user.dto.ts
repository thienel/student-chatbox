import { IsString, IsOptional, IsIn } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  @IsIn(['admin', 'lecturer', 'student'])
  role?: string;
}

export class UpdateUserStatusDto {
  @IsString()
  @IsIn(['active', 'suspended'])
  status: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class ResetPasswordDto {
  @IsString()
  newPassword: string;
}
