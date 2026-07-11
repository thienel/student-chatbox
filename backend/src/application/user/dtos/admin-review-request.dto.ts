import { IsString, IsNotEmpty } from 'class-validator';

export class AdminReviewRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'Reason is required' })
  reason: string;
}
