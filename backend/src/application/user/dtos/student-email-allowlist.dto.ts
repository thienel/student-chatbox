import { IsEmail, IsNotEmpty, IsOptional, IsString, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStudentEmailAllowlistDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  studentCode: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsOptional()
  campus?: string;

  @IsDateString()
  @IsOptional()
  expiresAt?: Date;
}

export class BulkImportStudentEmailAllowlistDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStudentEmailAllowlistDto)
  records: CreateStudentEmailAllowlistDto[];
}

export class GetAllowlistQueryDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  campus?: string;

  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}
