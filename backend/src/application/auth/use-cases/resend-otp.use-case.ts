import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IUserRepository } from '../../../domain/user/repositories/user.repository.interface';
import { IOtpTokenRepository } from '../../../domain/user/repositories/otp-token.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { ResendOtpDto } from '../dtos/resend-otp.dto';
import { UserStatus } from '../../../domain/user/entities/user.entity';
import { OtpTokenType } from '../../../domain/user/entities/otp-token.entity';
import { EmailService } from '../../../infrastructure/email/email.service';

@Injectable()
export class ResendOtpUseCase {
  constructor(
    @Inject(TOKENS.USER_REPO) private readonly userRepo: IUserRepository,
    @Inject(TOKENS.OTP_TOKEN_REPO) private readonly otpRepo: IOtpTokenRepository,
    private readonly emailService: EmailService,
  ) {}

  async execute(dto: ResendOtpDto): Promise<{ message: string }> {
    const user = await this.userRepo.findByEmail(dto.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status === UserStatus.ACTIVE) {
      throw new BadRequestException('Account is already active');
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Revoke old tokens
    await this.otpRepo.revokeAllForEmail(dto.email, OtpTokenType.EMAIL_VERIFY);
    
    // Save new token
    await this.otpRepo.create({
      userId: user.id,
      email: dto.email,
      code: otp,
      type: OtpTokenType.EMAIL_VERIFY,
      expiresAt,
    });

    // Send email
    await this.emailService.sendOtpEmail(dto.email, otp, 'email_verify');

    return { message: 'A new OTP has been sent to your email.' };
  }
}
