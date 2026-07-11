import { Injectable, Inject } from '@nestjs/common';
import { IOtpTokenRepository } from '../../../domain/user/repositories/otp-token.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { OtpTokenType } from '../../../domain/user/entities/otp-token.entity';
import { EmailService } from '../../../infrastructure/email/email.service';

@Injectable()
export class OtpService {
  constructor(
    @Inject(TOKENS.OTP_TOKEN_REPO) private readonly otpRepo: IOtpTokenRepository,
    private readonly emailService: EmailService,
  ) {}

  async generateAndSaveOtp(
    userId: string,
    email: string,
    type: OtpTokenType,
    expiresInMinutes: number = 10,
    emailTemplate: 'email_verify' | 'password_reset'
  ): Promise<string> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    // Revoke old tokens
    await this.otpRepo.revokeAllForEmail(email, type);
    
    // Save new token
    await this.otpRepo.create({
      userId,
      email,
      code: otp,
      type,
      expiresAt,
    });

    // Send email
    await this.emailService.sendOtpEmail(email, otp, emailTemplate);

    return otp;
  }
}
