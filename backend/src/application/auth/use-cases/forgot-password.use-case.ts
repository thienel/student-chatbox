import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IUserRepository } from '../../../domain/user/repositories/user.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { ForgotPasswordDto } from '../dtos/forgot-password.dto';
import { UserStatus } from '../../../domain/user/entities/user.entity';
import { OtpTokenType } from '../../../domain/user/entities/otp-token.entity';
import { OtpService } from '../services/otp.service';

@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    @Inject(TOKENS.USER_REPO) private readonly userRepo: IUserRepository,
    private readonly otpService: OtpService,
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

    // Generate and send OTP
    await this.otpService.generateAndSaveOtp(
      user.id,
      dto.email,
      OtpTokenType.PASSWORD_RESET,
      10,
      'password_reset'
    );

    return { message: 'If that email is registered, a password reset OTP has been sent.' };
  }
}
