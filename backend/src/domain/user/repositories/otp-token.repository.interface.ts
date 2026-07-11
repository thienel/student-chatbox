import { OtpToken, OtpTokenType } from '../entities/otp-token.entity';

export interface IOtpTokenRepository {
  create(data: {
    userId?: string;
    email: string;
    code: string;
    type: OtpTokenType;
    expiresAt: Date;
  }): Promise<OtpToken>;

  findValidToken(email: string, code: string, type: OtpTokenType): Promise<OtpToken | null>;

  markAsUsed(id: string): Promise<void>;

  revokeAllForEmail(email: string, type: OtpTokenType): Promise<void>;
}
