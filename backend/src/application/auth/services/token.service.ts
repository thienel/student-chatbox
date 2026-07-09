import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { IRefreshTokenRepository } from '../../../domain/user/repositories/refresh-token.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  permissions: string[];
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @Inject(TOKENS.REFRESH_TOKEN_REPO) private readonly refreshTokenRepo: IRefreshTokenRepository,
  ) {}

  generateAccessToken(payload: TokenPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES', '15m'),
    });
  }

  async generateAndSaveRefreshToken(userId: string): Promise<string> {
    const rawRefreshToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.refreshTokenRepo.create({
      userId,
      tokenHash,
      expiresAt,
    });

    return rawRefreshToken;
  }
}
