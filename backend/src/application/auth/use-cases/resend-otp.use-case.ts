import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IUserRepository } from '../../../domain/user/repositories/user.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { ResendOtpDto } from '../dtos/resend-otp.dto';
import { UserStatus } from '../../../domain/user/entities/user.entity';
import { OtpTokenType } from '../../../domain/user/entities/otp-token.entity';
import { OtpService } from '../services/otp.service';

@Injectable()
export class ResendOtpUseCase {
  constructor(
    @Inject(TOKENS.USER_REPO) private readonly userRepo: IUserRepository,
    private readonly otpService: OtpService,
  ) {}

  async execute(dto: ResendOtpDto): Promise<{ message: string }> {
    const user = await this.userRepo.findByEmail(dto.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status === UserStatus.ACTIVE) {
      throw new BadRequestException('Account is already active');
    }

    // Generate and send OTP
    await this.otpService.generateAndSaveOtp(
      user.id,
      dto.email,
      OtpTokenType.EMAIL_VERIFY,
      10,
      'email_verify'
    );

    return { message: 'A new OTP has been sent to your email.' };
  }
}
