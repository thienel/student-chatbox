import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './interface/http/auth/auth.module';
import { UserModule } from './interface/http/user/user.module';
import { SubjectModule } from './interface/http/subject/subject.module';
import { DocumentModule } from './interface/http/document/document.module';
import { ChatModule } from './interface/http/chat/chat.module';
import { SystemModule } from './interface/http/system/system.module';
import { InternalModule } from './interface/http/internal/internal.module';
import { HealthController } from './interface/http/health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    UserModule,
    SubjectModule,
    DocumentModule,
    ChatModule,
    SystemModule,
    InternalModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
