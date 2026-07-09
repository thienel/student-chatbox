import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { IUserRepository } from '../../../domain/user/repositories/user.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { LoginDto } from '../dtos/login.dto';
import { UserStatus } from '../../../domain/user/entities/user.entity';
import { IPasswordService } from '../../../domain/auth/services/password.service.interface';
import { TokenService, TokenPayload } from '../services/token.service';

export interface LoginUseCaseResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    permissions: string[];
  };
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(TOKENS.USER_REPO) private readonly userRepo: IUserRepository,
    @Inject('IPasswordService') private readonly passwordService: IPasswordService,
    private readonly tokenService: TokenService,
  ) {}

  async execute(dto: LoginDto): Promise<LoginUseCaseResult> {
    const user = await this.userRepo.findByEmailWithPermissions(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await this.passwordService.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Tài khoản đã bị khóa');
    }
    
    if (user.status === UserStatus.PENDING_EMAIL_VERIFICATION) {
      throw new UnauthorizedException('Vui lòng xác thực email trước khi đăng nhập');
    }

    if (user.status === UserStatus.PENDING_MANUAL_VERIFICATION) {
      throw new UnauthorizedException('Tài khoản đang chờ admin duyệt. Vui lòng quay lại sau.');
    }

    if (user.status === UserStatus.REJECTED) {
      throw new UnauthorizedException('Yêu cầu tạo tài khoản của bạn đã bị từ chối.');
    }

    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.roleName || '',
      permissions: user.permissions ?? [],
    };

    const accessToken = this.tokenService.generateAccessToken(payload);
    const rawRefreshToken = await this.tokenService.generateAndSaveRefreshToken(user.id);

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.roleName ?? '',
        permissions: user.permissions ?? [],
      },
    };
  }
}
