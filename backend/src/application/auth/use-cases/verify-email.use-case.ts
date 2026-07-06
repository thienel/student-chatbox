import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { IUserRepository } from '../../../domain/user/repositories/user.repository.interface';
import { IOtpTokenRepository } from '../../../domain/user/repositories/otp-token.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { VerifyOtpDto } from '../dtos/verify-otp.dto';
import { UserStatus } from '../../../domain/user/entities/user.entity';
import { OtpTokenType } from '../../../domain/user/entities/otp-token.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { StudentVerificationRequestOrmEntity } from '../../../infrastructure/database/typeorm/orm-entities/student-verification-request.orm-entity';
import { StudentEmailAllowlistService } from '../../user/services/student-email-allowlist.service';
import { UserOrmEntity } from '../../../infrastructure/database/typeorm/orm-entities/user.orm-entity';

@Injectable()
export class VerifyEmailUseCase {
  constructor(
    @Inject(TOKENS.USER_REPO) private readonly userRepo: IUserRepository,
    @Inject(TOKENS.OTP_TOKEN_REPO) private readonly otpRepo: IOtpTokenRepository,
    @InjectRepository(StudentVerificationRequestOrmEntity)
    private readonly requestRepo: Repository<StudentVerificationRequestOrmEntity>,
    private readonly allowlistService: StudentEmailAllowlistService,
    private readonly dataSource: DataSource,
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

    let newStatus = UserStatus.ACTIVE;
    let successMessage = 'Xác minh email thành công. Tài khoản của bạn đã được kích hoạt.';
    let successCode = 'EMAIL_VERIFIED';

    if (user.registrationSource === 'personal_email_allowlist') {
      if (!user.studentCode) {
        throw new BadRequestException('Tài khoản lỗi: Không có mã sinh viên.');
      }
      const allowlistRecord = await this.allowlistService.findAvailableByEmailAndStudentCode(user.email, user.studentCode);
      if (!allowlistRecord) {
        throw new BadRequestException('Không tìm thấy dữ liệu allowlist tương ứng hoặc đã bị claim.');
      }

      await this.dataSource.transaction(async manager => {
        await this.allowlistService.claimAllowlistRecord(allowlistRecord.id, user.id, manager);
        await manager.update(UserOrmEntity, user.id, {
          status: UserStatus.ACTIVE,
          emailVerifiedAt: new Date(),
        });
        await this.otpRepo.markAsUsed(token.id);
      });

    } else if (user.registrationSource === 'manual_verification') {
      newStatus = UserStatus.PENDING_MANUAL_VERIFICATION;
      successMessage = 'Xác minh email thành công. Vui lòng chờ quản trị viên phê duyệt.';
      successCode = 'EMAIL_VERIFIED_PENDING_ADMIN';
      
      await this.userRepo.update(user.id, { 
        status: newStatus,
        emailVerifiedAt: new Date()
      });
      await this.otpRepo.markAsUsed(token.id);
    } else {
      // fpt_email or other
      await this.userRepo.update(user.id, { 
        status: newStatus,
        emailVerifiedAt: new Date()
      });
      await this.otpRepo.markAsUsed(token.id);
    }

    return { 
      message: successMessage,
      code: successCode 
    };
  }
}
