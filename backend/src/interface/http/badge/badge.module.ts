import { Module } from '@nestjs/common';
import { BadgeController } from './badge.controller';
import { BadgeService } from '../../../application/badge/badge.service';
import { ListBadgesUseCase } from '../../../application/badge/use-cases/list-badges.use-case';
import { GetUserBadgesUseCase } from '../../../application/badge/use-cases/get-user-badges.use-case';
import { GetMyBadgesUseCase } from '../../../application/badge/use-cases/get-my-badges.use-case';
import { TypeOrmDatabaseModule } from '../../../infrastructure/database/typeorm/typeorm.module';

@Module({
  imports: [TypeOrmDatabaseModule],
  controllers: [BadgeController],
  providers: [BadgeService, ListBadgesUseCase, GetUserBadgesUseCase, GetMyBadgesUseCase],
  exports: [BadgeService],
})
export class BadgeModule {}
