import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { IUserRepository } from '../../../domain/user/repositories/user.repository.interface';
import { IOtpTokenRepository } from '../../../domain/user/repositories/otp-token.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { VerifyOtpDto } from '../dtos/verify-otp.dto';
import { UserStatus } from '../../../domain/user/entities/user.entity';
import { OtpTokenType } from '../../../domain/user/entities/otp-token.entity';

@Injectable()
export class VerifyEmailUseCase {
  constructor(
    @Inject(TOKENS.USER_REPO) private readonly userRepo: IUserRepository,
    @Inject(TOKENS.OTP_TOKEN_REPO) private readonly otpRepo: IOtpTokenRepository,
  ) {}

  async execute(dto: VerifyOtpDto): Promise<{ message: string }> {
    const token = await this.otpRepo.findValidToken(dto.email, dto.otp, OtpTokenType.EMAIL_VERIFY);
    if (!token) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    const user = await this.userRepo.findByEmail(dto.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    if (user.status === UserStatus.ACTIVE) {
      throw new BadRequestException('Account is already active');
    }

    // Activate user
    await this.userRepo.update(user.id, { status: UserStatus.ACTIVE });

    // Mark OTP as used
    await this.otpRepo.markAsUsed(token.id);

    return { message: 'Email verified successfully. You can now login.' };
  }
}
