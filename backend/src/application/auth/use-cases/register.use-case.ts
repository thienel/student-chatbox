import { Injectable, Inject, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IUserRepository } from '../../../domain/user/repositories/user.repository.interface';
import { IRoleRepository } from '../../../domain/user/repositories/role.repository.interface';
import { IOtpTokenRepository } from '../../../domain/user/repositories/otp-token.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { RegisterDto } from '../dtos/register.dto';
import { UserStatus } from '../../../domain/user/entities/user.entity';
import { OtpTokenType } from '../../../domain/user/entities/otp-token.entity';
import { EmailService } from '../../../infrastructure/email/email.service';

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(TOKENS.USER_REPO) private readonly userRepo: IUserRepository,
    @Inject(TOKENS.ROLE_REPO) private readonly roleRepo: IRoleRepository,
    @Inject(TOKENS.OTP_TOKEN_REPO) private readonly otpRepo: IOtpTokenRepository,
    private readonly emailService: EmailService,
  ) {}

  async execute(dto: RegisterDto): Promise<{ message: string }> {
    // 1. Check if email already exists
    const existingUser = await this.userRepo.findByEmail(dto.email);
    if (existingUser) {
      if (existingUser.status === UserStatus.ACTIVE) {
        throw new ConflictException('Email already registered and active');
      }
      // If pending, we can update or just allow resending OTP.
      // For simplicity, we just delete the pending user to recreate it
      // or we can just reject it if we want strictness. Let's delete to recreate cleanly.
      await this.userRepo.delete(existingUser.id);
    }

    // 2. Resolve Role (default to 'student' if not provided)
    const roleCode = dto.roleCode || 'student';
    const role = await this.roleRepo.findByName(roleCode);
    if (!role) {
      throw new NotFoundException(`Role ${roleCode} not found`);
    }

    // 3. Hash Password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // 4. Create User (Pending Status)
    const user = await this.userRepo.create({
      email: dto.email,
      fullName: dto.fullName,
      passwordHash,
      roleId: role.id,
      status: UserStatus.PENDING,
    });

    // 5. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // 6. Invalidate old OTPs and create new one
    await this.otpRepo.revokeAllForEmail(dto.email, OtpTokenType.EMAIL_VERIFY);
    await this.otpRepo.create({
      userId: user.id,
      email: dto.email,
      code: otp,
      type: OtpTokenType.EMAIL_VERIFY,
      expiresAt,
    });

    // 7. Send Email
    await this.emailService.sendOtpEmail(dto.email, otp, 'email_verify');

    return { message: 'Registration successful. Please check your email for the OTP.' };
  }
}
