import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AiServiceClient } from './ai-service.client';

@Module({
  imports: [JwtModule.register({})],
  providers: [AiServiceClient],
  exports: [AiServiceClient],
})
export class AiModule {}
