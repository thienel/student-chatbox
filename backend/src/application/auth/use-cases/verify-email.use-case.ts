import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { IUserRepository } from '../../../domain/user/repositories/user.repository.interface';
import { IOtpTokenRepository } from '../../../domain/user/repositories/otp-token.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { VerifyOtpDto } from '../dtos/verify-otp.dto';
import { UserStatus } from '../../../domain/user/entities/user.entity';
import { OtpTokenType } from '../../../domain/user/entities/otp-token.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentVerificationRequestOrmEntity } from '../../../infrastructure/database/typeorm/orm-entities/student-verification-request.orm-entity';

@Injectable()
export class VerifyEmailUseCase {
  constructor(
    @Inject(TOKENS.USER_REPO) private readonly userRepo: IUserRepository,
    @Inject(TOKENS.OTP_TOKEN_REPO) private readonly otpRepo: IOtpTokenRepository,
    @InjectRepository(StudentVerificationRequestOrmEntity)
    private readonly requestRepo: Repository<StudentVerificationRequestOrmEntity>,
  ) {}

  async execute(dto: VerifyOtpDto): Promise<{ message: string; code: string }> {
    const email = dto.email.trim().toLowerCase();

    // 1. Find OTP
    const token = await this.otpRepo.findValidToken(email, dto.otp, OtpTokenType.EMAIL_VERIFY);
    if (!token) {
      throw new BadRequestException('Mã OTP không hợp lệ hoặc đã hết hạn.');
    }

    // 2. Find User
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản.');
    }
    
    // 3. Check status
    if (user.status === UserStatus.ACTIVE) {
      throw new BadRequestException('Tài khoản đã được kích hoạt trước đó.');
    }

    if (user.status !== UserStatus.PENDING_EMAIL_VERIFICATION) {
      throw new BadRequestException('Tài khoản không ở trạng thái chờ xác minh email.');
    }

    // 4. Check if user is a manual verification user
    const request = await this.requestRepo.findOne({ where: { userId: user.id } });
    
    let newStatus = UserStatus.ACTIVE;
    let successMessage = 'Xác minh email thành công. Tài khoản của bạn đã được kích hoạt.';
    let successCode = 'EMAIL_VERIFIED';

    if (request) {
      newStatus = UserStatus.PENDING_MANUAL_VERIFICATION;
      successMessage = 'Xác minh email thành công. Vui lòng chờ quản trị viên phê duyệt.';
      successCode = 'EMAIL_VERIFIED_PENDING_ADMIN';
    }

    // 5. Update user status and emailVerifiedAt
    await this.userRepo.update(user.id, { 
      status: newStatus,
      emailVerifiedAt: new Date()
    });

    // 6. Mark OTP as used
    await this.otpRepo.markAsUsed(token.id);

    return { 
      message: successMessage,
      code: successCode 
    };
  }
}
