export enum OtpTokenType {
  EMAIL_VERIFY = 'email_verify',
  PASSWORD_RESET = 'password_reset',
}

export class OtpToken {
  id: string;
  userId?: string;
  email: string;
  code: string;
  type: OtpTokenType;
  expiresAt: Date;
  usedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<OtpToken>) {
    Object.assign(this, partial);
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isUsed(): boolean {
    return this.usedAt !== null && this.usedAt !== undefined;
  }
}
