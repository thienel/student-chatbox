import { Injectable, Inject, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { IUserRepository } from '../../../domain/user/repositories/user.repository.interface';
import { IRoleRepository } from '../../../domain/user/repositories/role.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { RegisterStudentDto } from '../dtos/register-student.dto';
import { UserStatus } from '../../../domain/user/entities/user.entity';
import { OtpTokenType } from '../../../domain/user/entities/otp-token.entity';
import { IPasswordService } from '../../../domain/auth/services/password.service.interface';
import { OtpService } from '../services/otp.service';
import { isAllowedStudentEmail } from '../../../shared/helpers/email-domain.helper';

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(TOKENS.USER_REPO) private readonly userRepo: IUserRepository,
    @Inject(TOKENS.ROLE_REPO) private readonly roleRepo: IRoleRepository,
    @Inject('IPasswordService') private readonly passwordService: IPasswordService,
    private readonly otpService: OtpService,
  ) { }

  async execute(dto: RegisterStudentDto): Promise<{ message: string; code: string }> {
    // 1. Normalize email
    const email = dto.email.trim().toLowerCase();

    // 2. Check if email is valid FPT domain
    if (!isAllowedStudentEmail(email)) {
      throw new BadRequestException({
        message: 'Vui lòng sử dụng email sinh viên FPT để đăng ký tài khoản Student.',
        code: 'INVALID_STUDENT_EMAIL_DOMAIN'
      });
    }

    // 3. Check if email already exists
    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser) {
      throw new ConflictException({
        message: 'Email này đã được sử dụng. Vui lòng đăng nhập hoặc sử dụng chức năng quên mật khẩu.',
        code: 'EMAIL_ALREADY_EXISTS'
      });
    }

    // 4. Resolve 'student' Role
    const roleCode = 'student';
    const role = await this.roleRepo.findByName(roleCode);
    if (!role) {
      throw new NotFoundException(`Role ${roleCode} not found`);
    }

    // 5. Hash password
    const passwordHash = await this.passwordService.hash(dto.password);

    // 6. Create User (Pending Email Verification)
    const user = await this.userRepo.create({
      email,
      fullName: dto.fullName,
      passwordHash,
      roleId: role.id,
      status: UserStatus.PENDING_EMAIL_VERIFICATION,
    });

    // 7. Generate and Send OTP
    await this.otpService.generateAndSaveOtp(
      user.id,
      email,
      OtpTokenType.EMAIL_VERIFY,
      10,
      'email_verify'
    );

    return {
      message: 'Tài khoản đã được tạo. Vui lòng kiểm tra email FPT để xác minh tài khoản.',
      code: 'PENDING_EMAIL_VERIFICATION'
    };
  }
}
