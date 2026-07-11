import { Injectable, Inject, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { IUserRepository } from '../../../domain/user/repositories/user.repository.interface';
import { IRoleRepository } from '../../../domain/user/repositories/role.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { RegisterStudentDto } from '../dtos/register-student.dto';
import { UserStatus } from '../../../domain/user/entities/user.entity';
import { OtpTokenType } from '../../../domain/user/entities/otp-token.entity';
import { IPasswordService } from '../../../domain/auth/services/password.service.interface';
import { OtpService } from '../services/otp.service';
import { EmailDomainService } from '../services/email-domain.service';
import { StudentEmailAllowlistService } from '../../user/services/student-email-allowlist.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentVerificationRequestOrmEntity, VerificationRequestStatus } from '../../../infrastructure/database/typeorm/orm-entities/student-verification-request.orm-entity';

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(TOKENS.USER_REPO) private readonly userRepo: IUserRepository,
    @Inject(TOKENS.ROLE_REPO) private readonly roleRepo: IRoleRepository,
    @Inject('IPasswordService') private readonly passwordService: IPasswordService,
    private readonly otpService: OtpService,
    private readonly emailDomainService: EmailDomainService,
    private readonly allowlistService: StudentEmailAllowlistService,
    @InjectRepository(StudentVerificationRequestOrmEntity)
    private readonly verificationRequestRepo: Repository<StudentVerificationRequestOrmEntity>,
  ) { }

  async execute(dto: RegisterStudentDto): Promise<{ message: string; code: string }> {
    const email = dto.email.trim().toLowerCase();

    // 1. Check if email already exists
    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser) {
      throw new ConflictException({
        message: 'Email này đã được sử dụng. Vui lòng đăng nhập hoặc sử dụng chức năng quên mật khẩu.',
        code: 'EMAIL_ALREADY_EXISTS'
      });
    }

    // 2. Resolve 'student' Role
    const roleCode = 'student';
    const role = await this.roleRepo.findByName(roleCode);
    if (!role) {
      throw new NotFoundException(`Role ${roleCode} not found`);
    }

    // 3. Hash password
    const passwordHash = await this.passwordService.hash(dto.password);

    // 4. Branch based on email domain
    const isFptEmail = this.emailDomainService.isAllowedStudentEmail(email);

    let registrationSource = 'fpt_email';
    let requiresManualVerification = false;

    if (!isFptEmail) {
      // Personal email flow
      if (!dto.studentCode) {
        throw new BadRequestException({
          message: 'Vui lòng cung cấp mã sinh viên khi đăng ký bằng email cá nhân.',
          code: 'STUDENT_CODE_REQUIRED'
        });
      }

      const normalizedCode = dto.studentCode.trim().toUpperCase();
      const allowlistRecord = await this.allowlistService.findAvailableByEmailAndStudentCode(email, normalizedCode);

      if (allowlistRecord && allowlistRecord.status === 'available') {
        // Fall inside allowlist -> activate automatically after OTP
        registrationSource = 'personal_email_allowlist';
      } else {
        // Not in allowlist -> Manual Verification Fallback
        registrationSource = 'manual_verification';
        requiresManualVerification = true;

        if (!dto.campus || !dto.reasonForNoFptEmail) {
          throw new BadRequestException({
            message: 'Email này không nằm trong danh sách ưu tiên. Vui lòng cung cấp thêm campus và lý do để duyệt thủ công.',
            code: 'MANUAL_VERIFICATION_INFO_REQUIRED'
          });
        }
      }
    }

    // 5. Create User (Active directly for testing)
    const user = await this.userRepo.create({
      email,
      fullName: dto.fullName,
      passwordHash,
      roleId: role.id,
      studentCode: dto.studentCode,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      registrationSource,
    });

    // 6. If Manual Verification, create the request
    if (requiresManualVerification) {
      const request = this.verificationRequestRepo.create({
        userId: user.id,
        studentCode: dto.studentCode!,
        campus: dto.campus,
        personalEmail: email,
        reasonForNoFptEmail: dto.reasonForNoFptEmail,
        studentCardUrl: dto.studentCardUrl,
        status: VerificationRequestStatus.PENDING,
      });
      await this.verificationRequestRepo.save(request);
    }

    // 7. Generate and Send OTP
    await this.otpService.generateAndSaveOtp(
      user.id,
      email,
      OtpTokenType.EMAIL_VERIFY,
      10,
      'email_verify'
    );

    return {
      message: 'Tài khoản đã được tạo và kích hoạt thành công. Bạn có thể đăng nhập ngay.',
      code: 'ACTIVE'
    };
  }
}
