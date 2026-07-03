import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IUserRepository } from '../../../domain/user/repositories/user.repository.interface';
import { IOtpTokenRepository } from '../../../domain/user/repositories/otp-token.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { ForgotPasswordDto } from '../dtos/forgot-password.dto';
import { UserStatus } from '../../../domain/user/entities/user.entity';
import { OtpTokenType } from '../../../domain/user/entities/otp-token.entity';
import { EmailService } from '../../../infrastructure/email/email.service';

@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    @Inject(TOKENS.USER_REPO) private readonly userRepo: IUserRepository,
    @Inject(TOKENS.OTP_TOKEN_REPO) private readonly otpRepo: IOtpTokenRepository,
    private readonly emailService: EmailService,
  ) {}

  async execute(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.userRepo.findByEmail(dto.email);
    // Return the same message whether user exists or not to prevent email enumeration
    if (!user) {
      return { message: 'If that email is registered, a password reset OTP has been sent.' };
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('Account is not active');
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Revoke old tokens
    await this.otpRepo.revokeAllForEmail(dto.email, OtpTokenType.PASSWORD_RESET);
    
    // Save new token
    await this.otpRepo.create({
      userId: user.id,
      email: dto.email,
      code: otp,
      type: OtpTokenType.PASSWORD_RESET,
      expiresAt,
    });

    // Send email
    await this.emailService.sendOtpEmail(dto.email, otp, 'password_reset');

    return { message: 'If that email is registered, a password reset OTP has been sent.' };
  }
}
