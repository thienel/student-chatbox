import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { IUserRepository } from '../../../domain/user/repositories/user.repository.interface';
import { IRefreshTokenRepository } from '../../../domain/user/repositories/refresh-token.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { LoginDto, LoginResponseDto } from '../dtos/login.dto';
import { UserStatus } from '../../../domain/user/entities/user.entity';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(TOKENS.USER_REPO) private readonly userRepo: IUserRepository,
    @Inject(TOKENS.REFRESH_TOKEN_REPO) private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async execute(dto: LoginDto): Promise<LoginResponseDto> {
    const userByEmail = await this.userRepo.findByEmail(dto.email);
    if (!userByEmail) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.userRepo.findByIdWithPermissions(userByEmail.id);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Account is suspended');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.roleName,
      permissions: user.permissions ?? [],
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES', '15m'),
    });

    // Use SHA-256 for refresh token storage (deterministic, for lookup)
    const rawRefreshToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.refreshTokenRepo.create({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

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
