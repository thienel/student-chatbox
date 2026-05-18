import { Injectable, Inject } from '@nestjs/common';
import * as crypto from 'crypto';
import { IRefreshTokenRepository } from '../../../domain/user/repositories/refresh-token.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(TOKENS.REFRESH_TOKEN_REPO) private readonly refreshTokenRepo: IRefreshTokenRepository,
  ) {}

  async execute(rawToken: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const tokenRecord = await this.refreshTokenRepo.findByTokenHash(tokenHash);
    if (tokenRecord) {
      await this.refreshTokenRepo.revoke(tokenRecord.id);
    }
  }
}
