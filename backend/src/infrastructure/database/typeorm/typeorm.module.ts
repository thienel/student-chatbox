import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RoleOrmEntity } from './orm-entities/role.orm-entity';
import { PermissionOrmEntity } from './orm-entities/permission.orm-entity';
import { UserOrmEntity } from './orm-entities/user.orm-entity';
import { RefreshTokenOrmEntity } from './orm-entities/refresh-token.orm-entity';
import { SubjectOrmEntity } from './orm-entities/subject.orm-entity';
import { DocumentOrmEntity } from './orm-entities/document.orm-entity';
import { ChatOrmEntity } from './orm-entities/chat.orm-entity';
import { MessageOrmEntity } from './orm-entities/message.orm-entity';
import { AiUsageLogOrmEntity } from './orm-entities/ai-usage-log.orm-entity';
import { SystemSettingOrmEntity } from './orm-entities/system-setting.orm-entity';
import { AuditLogOrmEntity } from './orm-entities/audit-log.orm-entity';
import { FlashcardSetOrmEntity } from './orm-entities/flashcard-set.orm-entity';
import { FlashcardSetStarOrmEntity } from './orm-entities/flashcard-set-star.orm-entity';
import { FlashcardOrmEntity } from './orm-entities/flashcard.orm-entity';
import { ExamOrmEntity } from './orm-entities/exam.orm-entity';
import { QuestionOrmEntity } from './orm-entities/question.orm-entity';
import { ExamAttemptOrmEntity } from './orm-entities/exam-attempt.orm-entity';
import { UserTypeOrmRepository } from './repositories/user.typeorm-repository';
import { RoleTypeOrmRepository } from './repositories/role.typeorm-repository';
import { RefreshTokenTypeOrmRepository } from './repositories/refresh-token.typeorm-repository';
import { SubjectTypeOrmRepository } from './repositories/subject.typeorm-repository';
import { DocumentTypeOrmRepository } from './repositories/document.typeorm-repository';
import { ChatTypeOrmRepository } from './repositories/chat.typeorm-repository';
import { SystemSettingTypeOrmRepository } from './repositories/system-setting.typeorm-repository';
import { AuditLogTypeOrmRepository } from './repositories/audit-log.typeorm-repository';
import { AiUsageLogTypeOrmRepository } from './repositories/ai-usage-log.typeorm-repository';
import { FlashcardTypeOrmRepository } from './repositories/flashcard.typeorm-repository';
import { ExamTypeOrmRepository } from './repositories/exam.typeorm-repository';
import { BookmarkOrmEntity } from './orm-entities/bookmark.orm-entity';
import { BookmarkTypeOrmRepository } from './repositories/bookmark.typeorm-repository';
import { ClassOrmEntity } from './orm-entities/class.orm-entity';
import { ClassEnrollmentOrmEntity } from './orm-entities/class-enrollment.orm-entity';
import { ClassTypeOrmRepository } from './repositories/class.typeorm-repository';
import { FlashcardProgressOrmEntity } from './orm-entities/flashcard-progress.orm-entity';
import { FlashcardStudySessionOrmEntity } from './orm-entities/flashcard-study-session.orm-entity';
import { StudentStudyStatsOrmEntity } from './orm-entities/student-study-stats.orm-entity';
import { StudentStudySettingsOrmEntity } from './orm-entities/student-study-settings.orm-entity';
import { StudyTypeOrmRepository } from './repositories/study.typeorm-repository';
import { StudentWeakTopicOrmEntity } from './orm-entities/student-weak-topic.orm-entity';
import { WeakTopicTypeOrmRepository } from './repositories/weak-topic.typeorm-repository';
import { StudentStudyPlanOrmEntity } from './orm-entities/student-study-plan.orm-entity';
import { StudyPlanTypeOrmRepository } from './repositories/study-plan.typeorm-repository';
import { UserBadgeOrmEntity } from './orm-entities/user-badge.orm-entity';
import { BadgeTypeOrmRepository } from './repositories/badge.typeorm-repository';
import { BoardQuestionOrmEntity } from './orm-entities/board-question.orm-entity';
import { BoardAnswerOrmEntity } from './orm-entities/board-answer.orm-entity';
import { BoardUpvoteOrmEntity } from './orm-entities/board-upvote.orm-entity';
import { BoardTypeOrmRepository } from './repositories/board.typeorm-repository';
import { DatabaseSeederService } from './seeds/seed.service';
import { TOKENS } from '../../../shared/constants/tokens';

const ormEntities = [
  RoleOrmEntity,
  PermissionOrmEntity,
  UserOrmEntity,
  RefreshTokenOrmEntity,
  SubjectOrmEntity,
  DocumentOrmEntity,
  ChatOrmEntity,
  MessageOrmEntity,
  AiUsageLogOrmEntity,
  SystemSettingOrmEntity,
  AuditLogOrmEntity,
  FlashcardSetOrmEntity,
  FlashcardSetStarOrmEntity,
  FlashcardOrmEntity,
  ExamOrmEntity,
  QuestionOrmEntity,
  ExamAttemptOrmEntity,
  BookmarkOrmEntity,
  ClassOrmEntity,
  ClassEnrollmentOrmEntity,
  FlashcardProgressOrmEntity,
  FlashcardStudySessionOrmEntity,
  StudentStudyStatsOrmEntity,
  StudentStudySettingsOrmEntity,
  StudentWeakTopicOrmEntity,
  StudentStudyPlanOrmEntity,
  UserBadgeOrmEntity,
  BoardQuestionOrmEntity,
  BoardAnswerOrmEntity,
  BoardUpvoteOrmEntity,
];

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities: ormEntities,
        synchronize: true,
        logging: config.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature(ormEntities),
  ],
  providers: [
    UserTypeOrmRepository,
    RoleTypeOrmRepository,
    RefreshTokenTypeOrmRepository,
    SubjectTypeOrmRepository,
    DocumentTypeOrmRepository,
    ChatTypeOrmRepository,
    SystemSettingTypeOrmRepository,
    AuditLogTypeOrmRepository,
    AiUsageLogTypeOrmRepository,
    FlashcardTypeOrmRepository,
    ExamTypeOrmRepository,
    BookmarkTypeOrmRepository,
    ClassTypeOrmRepository,
    StudyTypeOrmRepository,
    WeakTopicTypeOrmRepository,
    StudyPlanTypeOrmRepository,
    BadgeTypeOrmRepository,
    BoardTypeOrmRepository,
    DatabaseSeederService,
    { provide: TOKENS.USER_REPO, useClass: UserTypeOrmRepository },
    { provide: TOKENS.ROLE_REPO, useClass: RoleTypeOrmRepository },
    { provide: TOKENS.REFRESH_TOKEN_REPO, useClass: RefreshTokenTypeOrmRepository },
    { provide: TOKENS.SUBJECT_REPO, useClass: SubjectTypeOrmRepository },
    { provide: TOKENS.DOCUMENT_REPO, useClass: DocumentTypeOrmRepository },
    { provide: TOKENS.CHAT_REPO, useClass: ChatTypeOrmRepository },
    { provide: TOKENS.SYSTEM_SETTING_REPO, useClass: SystemSettingTypeOrmRepository },
    { provide: TOKENS.AUDIT_LOG_REPO, useClass: AuditLogTypeOrmRepository },
    { provide: TOKENS.AI_USAGE_LOG_REPO, useClass: AiUsageLogTypeOrmRepository },
    { provide: TOKENS.FLASHCARD_REPO, useClass: FlashcardTypeOrmRepository },
    { provide: TOKENS.EXAM_REPO, useClass: ExamTypeOrmRepository },
    { provide: TOKENS.BOOKMARK_REPO, useClass: BookmarkTypeOrmRepository },
    { provide: TOKENS.CLASS_REPO, useClass: ClassTypeOrmRepository },
    { provide: TOKENS.STUDY_REPO, useClass: StudyTypeOrmRepository },
    { provide: TOKENS.WEAK_TOPIC_REPO, useClass: WeakTopicTypeOrmRepository },
    { provide: TOKENS.STUDY_PLAN_REPO, useClass: StudyPlanTypeOrmRepository },
    { provide: TOKENS.BADGE_REPO, useClass: BadgeTypeOrmRepository },
    { provide: TOKENS.BOARD_REPO, useClass: BoardTypeOrmRepository },
  ],
  exports: [
    TypeOrmModule,
    { provide: TOKENS.USER_REPO, useClass: UserTypeOrmRepository },
    { provide: TOKENS.ROLE_REPO, useClass: RoleTypeOrmRepository },
    { provide: TOKENS.REFRESH_TOKEN_REPO, useClass: RefreshTokenTypeOrmRepository },
    { provide: TOKENS.SUBJECT_REPO, useClass: SubjectTypeOrmRepository },
    { provide: TOKENS.DOCUMENT_REPO, useClass: DocumentTypeOrmRepository },
    { provide: TOKENS.CHAT_REPO, useClass: ChatTypeOrmRepository },
    { provide: TOKENS.SYSTEM_SETTING_REPO, useClass: SystemSettingTypeOrmRepository },
    { provide: TOKENS.AUDIT_LOG_REPO, useClass: AuditLogTypeOrmRepository },
    { provide: TOKENS.AI_USAGE_LOG_REPO, useClass: AiUsageLogTypeOrmRepository },
    { provide: TOKENS.FLASHCARD_REPO, useClass: FlashcardTypeOrmRepository },
    { provide: TOKENS.EXAM_REPO, useClass: ExamTypeOrmRepository },
    { provide: TOKENS.BOOKMARK_REPO, useClass: BookmarkTypeOrmRepository },
    { provide: TOKENS.CLASS_REPO, useClass: ClassTypeOrmRepository },
    { provide: TOKENS.STUDY_REPO, useClass: StudyTypeOrmRepository },
    { provide: TOKENS.WEAK_TOPIC_REPO, useClass: WeakTopicTypeOrmRepository },
    UserTypeOrmRepository,
    RoleTypeOrmRepository,
    RefreshTokenTypeOrmRepository,
    SubjectTypeOrmRepository,
    DocumentTypeOrmRepository,
    ChatTypeOrmRepository,
    SystemSettingTypeOrmRepository,
    AuditLogTypeOrmRepository,
    AiUsageLogTypeOrmRepository,
    FlashcardTypeOrmRepository,
    ExamTypeOrmRepository,
    BookmarkTypeOrmRepository,
    ClassTypeOrmRepository,
    StudyTypeOrmRepository,
    WeakTopicTypeOrmRepository,
    StudyPlanTypeOrmRepository,
    BadgeTypeOrmRepository,
    BoardTypeOrmRepository,
  ],
})
export class TypeOrmDatabaseModule {}
