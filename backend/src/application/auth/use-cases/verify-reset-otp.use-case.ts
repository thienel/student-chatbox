import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { IUserRepository } from '../../../domain/user/repositories/user.repository.interface';
import { IOtpTokenRepository } from '../../../domain/user/repositories/otp-token.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { VerifyOtpDto } from '../dtos/verify-otp.dto';
import { UserStatus } from '../../../domain/user/entities/user.entity';
import { OtpTokenType } from '../../../domain/user/entities/otp-token.entity';

@Injectable()
export class VerifyResetOtpUseCase {
  constructor(
    @Inject(TOKENS.USER_REPO) private readonly userRepo: IUserRepository,
    @Inject(TOKENS.OTP_TOKEN_REPO) private readonly otpRepo: IOtpTokenRepository,
  ) {}

  async execute(dto: VerifyOtpDto): Promise<{ message: string; valid: boolean }> {
    const token = await this.otpRepo.findValidToken(dto.email, dto.otp, OtpTokenType.PASSWORD_RESET);
    if (!token) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    const user = await this.userRepo.findByEmail(dto.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    if (user.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('Account is not active');
    }

    // Notice we DO NOT mark the OTP as used here.
    // We only verify that it exists and is valid.

    return { message: 'OTP is valid', valid: true };
  }
}
