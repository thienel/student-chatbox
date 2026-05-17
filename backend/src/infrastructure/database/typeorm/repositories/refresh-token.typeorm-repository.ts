import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { IRefreshTokenRepository } from '../../../../domain/user/repositories/refresh-token.repository.interface';
import { RefreshToken } from '../../../../domain/user/entities/refresh-token.entity';
import { RefreshTokenOrmEntity } from '../orm-entities/refresh-token.orm-entity';

@Injectable()
export class RefreshTokenTypeOrmRepository implements IRefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshTokenOrmEntity)
    private readonly repo: Repository<RefreshTokenOrmEntity>,
  ) {}

  private toEntity(orm: RefreshTokenOrmEntity): RefreshToken {
    const token = new RefreshToken();
    token.id = orm.id;
    token.userId = orm.userId;
    token.tokenHash = orm.tokenHash;
    token.expiresAt = orm.expiresAt;
    token.revokedAt = orm.revokedAt;
    token.createdAt = orm.createdAt;
    return token;
  }

  async create(data: Partial<RefreshToken>): Promise<RefreshToken> {
    const orm = this.repo.create({
      userId: data.userId,
      tokenHash: data.tokenHash,
      expiresAt: data.expiresAt,
    });
    const saved = await this.repo.save(orm);
    return this.toEntity(saved);
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    const orm = await this.repo.findOne({ where: { tokenHash } });
    return orm ? this.toEntity(orm) : null;
  }

  async revoke(id: string): Promise<void> {
    await this.repo.update(id, { revokedAt: new Date() });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.repo.update({ userId }, { revokedAt: new Date() });
  }

  async deleteExpired(): Promise<void> {
    await this.repo.delete({ expiresAt: LessThan(new Date()) });
  }
}
