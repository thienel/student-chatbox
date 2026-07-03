import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IUserRepository } from '../../../domain/user/repositories/user.repository.interface';
import { IOtpTokenRepository } from '../../../domain/user/repositories/otp-token.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { ResetPasswordDto } from '../dtos/reset-password.dto';
import { UserStatus } from '../../../domain/user/entities/user.entity';
import { OtpTokenType } from '../../../domain/user/entities/otp-token.entity';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(TOKENS.USER_REPO) private readonly userRepo: IUserRepository,
    @Inject(TOKENS.OTP_TOKEN_REPO) private readonly otpRepo: IOtpTokenRepository,
  ) {}

  async execute(dto: ResetPasswordDto): Promise<{ message: string }> {
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

    // Hash new password
    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    // Update user password
    await this.userRepo.update(user.id, { passwordHash });

    // Mark OTP as used
    await this.otpRepo.markAsUsed(token.id);

    return { message: 'Password has been reset successfully. You can now login.' };
  }
}
