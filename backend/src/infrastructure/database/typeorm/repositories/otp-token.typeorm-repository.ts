import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, MoreThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { IOtpTokenRepository } from '../../../../domain/user/repositories/otp-token.repository.interface';
import { OtpToken, OtpTokenType } from '../../../../domain/user/entities/otp-token.entity';
import { OtpTokenEntity } from '../orm-entities/otp-token.orm-entity';

@Injectable()
export class OtpTokenTypeOrmRepository implements IOtpTokenRepository {
  constructor(
    @InjectRepository(OtpTokenEntity)
    private readonly repo: Repository<OtpTokenEntity>,
  ) {}

  private mapToDomain(entity: OtpTokenEntity): OtpToken {
    return new OtpToken({
      id: entity.id,
      userId: entity.userId,
      email: entity.email,
      codeHash: entity.codeHash,
      type: entity.type as OtpTokenType,
      expiresAt: entity.expiresAt,
      usedAt: entity.usedAt,
      failedAttempts: entity.failedAttempts,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  async create(data: {
    userId?: string;
    email: string;
    codeHash: string;
    type: OtpTokenType;
    expiresAt: Date;
  }): Promise<OtpToken> {
    const entity = this.repo.create(data);
    const saved = await this.repo.save(entity);
    return this.mapToDomain(saved);
  }

  async findValidToken(email: string, code: string, type: OtpTokenType): Promise<OtpToken | null> {
    const entity = await this.repo.findOne({
      where: {
        email,
        type,
        usedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      order: {
        createdAt: 'DESC',
      },
    });

    if (!entity) return null;

    const isValid = await bcrypt.compare(code, entity.codeHash);
    if (!isValid) {
      // A token is invalidated on the fifth failed verification. A fresh OTP
      // is then required instead of allowing unlimited online guesses.
      const failedAttempts = entity.failedAttempts + 1;
      await this.repo.update(entity.id, {
        failedAttempts,
        ...(failedAttempts >= 5 ? { usedAt: new Date() } : {}),
      });
      return null;
    }

    return this.mapToDomain(entity);
  }

  async markAsUsed(id: string): Promise<void> {
    await this.repo.update(id, { usedAt: new Date() });
  }

  async revokeAllForEmail(email: string, type: OtpTokenType): Promise<void> {
    await this.repo.update(
      { email, type, usedAt: IsNull() },
      { usedAt: new Date() } // Marking them as "used" to invalidate them
    );
  }
}
