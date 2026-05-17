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
import { UserTypeOrmRepository } from './repositories/user.typeorm-repository';
import { RoleTypeOrmRepository } from './repositories/role.typeorm-repository';
import { RefreshTokenTypeOrmRepository } from './repositories/refresh-token.typeorm-repository';
import { SubjectTypeOrmRepository } from './repositories/subject.typeorm-repository';
import { DocumentTypeOrmRepository } from './repositories/document.typeorm-repository';
import { ChatTypeOrmRepository } from './repositories/chat.typeorm-repository';
import { SystemSettingTypeOrmRepository } from './repositories/system-setting.typeorm-repository';
import { AuditLogTypeOrmRepository } from './repositories/audit-log.typeorm-repository';
import { AiUsageLogTypeOrmRepository } from './repositories/ai-usage-log.typeorm-repository';
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
    { provide: TOKENS.USER_REPO, useClass: UserTypeOrmRepository },
    { provide: TOKENS.ROLE_REPO, useClass: RoleTypeOrmRepository },
    { provide: TOKENS.REFRESH_TOKEN_REPO, useClass: RefreshTokenTypeOrmRepository },
    { provide: TOKENS.SUBJECT_REPO, useClass: SubjectTypeOrmRepository },
    { provide: TOKENS.DOCUMENT_REPO, useClass: DocumentTypeOrmRepository },
    { provide: TOKENS.CHAT_REPO, useClass: ChatTypeOrmRepository },
    { provide: TOKENS.SYSTEM_SETTING_REPO, useClass: SystemSettingTypeOrmRepository },
    { provide: TOKENS.AUDIT_LOG_REPO, useClass: AuditLogTypeOrmRepository },
    { provide: TOKENS.AI_USAGE_LOG_REPO, useClass: AiUsageLogTypeOrmRepository },
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
    UserTypeOrmRepository,
    RoleTypeOrmRepository,
    RefreshTokenTypeOrmRepository,
    SubjectTypeOrmRepository,
    DocumentTypeOrmRepository,
    ChatTypeOrmRepository,
    SystemSettingTypeOrmRepository,
    AuditLogTypeOrmRepository,
    AiUsageLogTypeOrmRepository,
  ],
})
export class TypeOrmDatabaseModule {}
