import { Module } from '@nestjs/common';
import { InternalController } from './internal.controller';
import { TypeOrmDatabaseModule } from '../../../infrastructure/database/typeorm/typeorm.module';

@Module({
  imports: [TypeOrmDatabaseModule],
  controllers: [InternalController],
})
export class InternalModule {}
