import { Injectable, Inject, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentVerificationRequestOrmEntity, VerificationRequestStatus } from '../../../infrastructure/database/typeorm/orm-entities/student-verification-request.orm-entity';
import { IUserRepository } from '../../../domain/user/repositories/user.repository.interface';
import { IRoleRepository } from '../../../domain/user/repositories/role.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { CreateStudentVerificationRequestDto } from '../dtos/create-student-verification-request.dto';
import { User, UserStatus } from '../../../domain/user/entities/user.entity';
import { IPasswordService } from '../../../domain/auth/services/password.service.interface';
import { isAllowedStudentEmail } from '../../../shared/helpers/email-domain.helper';
import { EmailService } from '../../../infrastructure/email/email.service';
import { OtpService } from '../../auth/services/otp.service';
import { OtpTokenType } from '../../../domain/user/entities/otp-token.entity';

@Injectable()
export class StudentVerificationService {
  constructor(
    @InjectRepository(StudentVerificationRequestOrmEntity)
    private readonly requestRepo: Repository<StudentVerificationRequestOrmEntity>,
    @Inject(TOKENS.USER_REPO) private readonly userRepo: IUserRepository,
    @Inject(TOKENS.ROLE_REPO) private readonly roleRepo: IRoleRepository,
    @Inject('IPasswordService') private readonly passwordService: IPasswordService,
    private readonly emailService: EmailService,
    private readonly otpService: OtpService,
  ) {}

  async createManualVerificationRequest(dto: CreateStudentVerificationRequestDto): Promise<{ message: string; code: string }> {
    const email = dto.email.trim().toLowerCase();
    const personalEmail = dto.personalEmail.trim().toLowerCase();

    // 1. Check if email is FPT domain (not allowed in manual verification)
    if (isAllowedStudentEmail(email)) {
      throw new BadRequestException({
        message: 'Vui lòng sử dụng luồng đăng ký sinh viên thông thường cho email FPT.',
        code: 'USE_STANDARD_REGISTRATION'
      });
    }

    // 2. Check if email already exists
    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser) {
      throw new ConflictException({
        message: 'Email này đã được sử dụng. Vui lòng đăng nhập hoặc sử dụng chức năng quên mật khẩu.',
        code: 'EMAIL_ALREADY_EXISTS'
      });
    }

    // 3. Resolve student role
    const role = await this.roleRepo.findByName('student');
    if (!role) {
      throw new NotFoundException('Role student not found');
    }

    // 4. Hash password
    const passwordHash = await this.passwordService.hash(dto.password);

    // 5. Create User (Pending Email Verification status)
    const user = await this.userRepo.create({
      email,
      fullName: dto.fullName,
      passwordHash,
      roleId: role.id,
      status: UserStatus.PENDING_EMAIL_VERIFICATION,
    });

    // 6. Create Student Verification Request
    const request = this.requestRepo.create({
      userId: user.id,
      studentCode: dto.studentCode,
      campus: dto.campus,
      personalEmail,
      status: VerificationRequestStatus.PENDING,
    });
    await this.requestRepo.save(request);

    // 7. Generate and Send OTP
    await this.otpService.generateAndSaveOtp(
      user.id,
      personalEmail,
      OtpTokenType.EMAIL_VERIFY,
      10,
      'email_verify'
    );

    return {
      message: 'Mã xác minh đã được gửi đến email cá nhân của bạn. Vui lòng kiểm tra hộp thư.',
      code: 'PENDING_EMAIL_VERIFICATION'
    };
  }

  async getPendingRequests(): Promise<StudentVerificationRequestOrmEntity[]> {
    return this.requestRepo.find({
      where: [
        { status: VerificationRequestStatus.PENDING },
        { status: VerificationRequestStatus.NEED_MORE_INFO }
      ],
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getRequestDetail(id: string): Promise<StudentVerificationRequestOrmEntity> {
    const request = await this.requestRepo.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!request) {
      throw new NotFoundException('Không tìm thấy yêu cầu xác minh.');
    }
    return request;
  }

  async approveRequest(id: string, adminId: string): Promise<{ message: string; code: string }> {
    const request = await this.getRequestDetail(id);
    if (request.status === VerificationRequestStatus.APPROVED) {
      throw new BadRequestException('Yêu cầu đã được duyệt trước đó.');
    }

    // 1. Update verification request
    request.status = VerificationRequestStatus.APPROVED;
    request.reviewedBy = adminId;
    request.reviewedAt = new Date();
    await this.requestRepo.save(request);

    // 2. Update user status to ACTIVE and set student_code
    await this.userRepo.update(request.userId, {
      status: UserStatus.ACTIVE,
      studentCode: request.studentCode,
    });

    // Send email
    await this.emailService.sendEmail(
      request.personalEmail,
      'Yêu cầu xác minh sinh viên đã được phê duyệt',
      `<p>Chúc mừng! Tài khoản của bạn đã được xác minh thành công. Bạn có thể đăng nhập bằng email: <b>${request.user.email}</b></p>`
    );

    return {
      message: 'Tài khoản sinh viên đã được xác minh thành công.',
      code: 'STUDENT_VERIFICATION_APPROVED'
    };
  }

  async rejectRequest(id: string, adminId: string, reason: string): Promise<{ message: string; code: string }> {
    const request = await this.getRequestDetail(id);
    
    request.status = VerificationRequestStatus.REJECTED;
    request.rejectionReason = reason;
    request.reviewedBy = adminId;
    request.reviewedAt = new Date();
    await this.requestRepo.save(request);

    // Update user status to REJECTED
    await this.userRepo.update(request.userId, {
      status: UserStatus.REJECTED,
    });

    // Send email
    await this.emailService.sendEmail(
      request.personalEmail,
      'Yêu cầu xác minh sinh viên đã bị từ chối',
      `<p>Yêu cầu xác minh của bạn đã bị từ chối.</p><p>Lý do: <b>${reason}</b></p>`
    );

    return {
      message: 'Yêu cầu xác minh đã bị từ chối.',
      code: 'STUDENT_VERIFICATION_REJECTED'
    };
  }

  async requestMoreInfo(id: string, adminId: string, reason: string): Promise<{ message: string; code: string }> {
    const request = await this.getRequestDetail(id);
    
    request.status = VerificationRequestStatus.NEED_MORE_INFO;
    request.rejectionReason = reason;
    request.reviewedBy = adminId;
    request.reviewedAt = new Date();
    await this.requestRepo.save(request);

    // User status remains PENDING_MANUAL_VERIFICATION
    
    // Send email
    await this.emailService.sendEmail(
      request.personalEmail,
      'Yêu cầu bổ sung thông tin xác minh',
      `<p>Yêu cầu xác minh của bạn cần bổ sung thêm thông tin.</p><p>Yêu cầu từ quản trị viên: <b>${reason}</b></p>`
    );

    return {
      message: 'Yêu cầu bổ sung thông tin đã được gửi.',
      code: 'STUDENT_VERIFICATION_MORE_INFO_REQUESTED'
    };
  }
}
