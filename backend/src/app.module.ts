import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './interface/http/auth/auth.module';
import { UserModule } from './interface/http/user/user.module';
import { SubjectModule } from './interface/http/subject/subject.module';
import { ClassModule } from './interface/http/class/class.module';
import { DocumentModule } from './interface/http/document/document.module';
import { ChatModule } from './interface/http/chat/chat.module';
import { SystemModule } from './interface/http/system/system.module';
import { InternalModule } from './interface/http/internal/internal.module';
import { FlashcardModule } from './interface/http/flashcard/flashcard.module';
import { StudyModule } from './interface/http/study/study.module';
import { ExamModule } from './interface/http/exam/exam.module';
import { BookmarkModule } from './interface/http/bookmark/bookmark.module';
import { AnalyticsModule } from './interface/http/analytics/analytics.module';
import { RbacModule } from './interface/http/rbac/rbac.module';
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
    ClassModule,
    DocumentModule,
    ChatModule,
    SystemModule,
    InternalModule,
    FlashcardModule,
    StudyModule,
    ExamModule,
    BookmarkModule,
    AnalyticsModule,
    RbacModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
