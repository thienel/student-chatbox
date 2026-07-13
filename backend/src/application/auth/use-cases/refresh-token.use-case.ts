import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { IRefreshTokenRepository } from '../../../domain/user/repositories/refresh-token.repository.interface';
import { IUserRepository } from '../../../domain/user/repositories/user.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { TokenService } from '../services/token.service';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(TOKENS.REFRESH_TOKEN_REPO) private readonly refreshTokenRepo: IRefreshTokenRepository,
    @Inject(TOKENS.USER_REPO) private readonly userRepo: IUserRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(rawToken: string): Promise<{ accessToken: string; refreshToken: string }> {
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
      roleName: user.roleName ?? '',
      permissions: user.permissions ?? [],
    };

    // Rotate refresh token on every refresh to reduce replay window.
    await this.refreshTokenRepo.revoke(tokenRecord.id);
    const accessToken = this.tokenService.generateAccessToken(payload);
    const refreshToken = await this.tokenService.generateAndSaveRefreshToken(user.id);

    return { accessToken, refreshToken };
  }
}
