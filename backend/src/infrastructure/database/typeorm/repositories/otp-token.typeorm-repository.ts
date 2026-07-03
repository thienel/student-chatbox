import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, MoreThan } from 'typeorm';
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
      code: entity.code,
      type: entity.type as OtpTokenType,
      expiresAt: entity.expiresAt,
      usedAt: entity.usedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  async create(data: {
    userId?: string;
    email: string;
    code: string;
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
        code,
        type,
        usedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return entity ? this.mapToDomain(entity) : null;
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
