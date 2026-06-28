import { Module } from '@nestjs/common';
import { BoardController } from './board.controller';
import { BoardService } from '../../../application/board/board.service';
import { TypeOrmDatabaseModule } from '../../../infrastructure/database/typeorm/typeorm.module';
import { ClassModule } from '../class/class.module';
import { BadgeModule } from '../badge/badge.module';

@Module({
  imports: [TypeOrmDatabaseModule, ClassModule, BadgeModule],
  controllers: [BoardController],
  providers: [BoardService],
})
export class BoardModule {}
