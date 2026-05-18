import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { IRefreshTokenRepository } from '../../../domain/user/repositories/refresh-token.repository.interface';
import { IUserRepository } from '../../../domain/user/repositories/user.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(TOKENS.REFRESH_TOKEN_REPO) private readonly refreshTokenRepo: IRefreshTokenRepository,
    @Inject(TOKENS.USER_REPO) private readonly userRepo: IUserRepository,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async execute(rawToken: string): Promise<{ accessToken: string }> {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const tokenRecord = await this.refreshTokenRepo.findByTokenHash(tokenHash);

    if (!tokenRecord || tokenRecord.revokedAt || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.userRepo.findByIdWithPermissions(tokenRecord.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
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

    return { accessToken };
  }
}
