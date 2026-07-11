import { DataSource } from 'typeorm';
import { UserOrmEntity } from './infrastructure/database/typeorm/orm-entities/user.orm-entity';
import { RoleOrmEntity } from './infrastructure/database/typeorm/orm-entities/role.orm-entity';
import { PermissionOrmEntity } from './infrastructure/database/typeorm/orm-entities/permission.orm-entity';
import { ChatOrmEntity } from './infrastructure/database/typeorm/orm-entities/chat.orm-entity';
import { MessageOrmEntity } from './infrastructure/database/typeorm/orm-entities/message.orm-entity';
import { AiUsageLogOrmEntity } from './infrastructure/database/typeorm/orm-entities/ai-usage-log.orm-entity';
import { SystemSettingOrmEntity } from './infrastructure/database/typeorm/orm-entities/system-setting.orm-entity';
import { AuditLogOrmEntity } from './infrastructure/database/typeorm/orm-entities/audit-log.orm-entity';
import { SubjectOrmEntity } from './infrastructure/database/typeorm/orm-entities/subject.orm-entity';
import { DocumentOrmEntity } from './infrastructure/database/typeorm/orm-entities/document.orm-entity';
import { RefreshTokenOrmEntity } from './infrastructure/database/typeorm/orm-entities/refresh-token.orm-entity';
import { ClassOrmEntity } from './infrastructure/database/typeorm/orm-entities/class.orm-entity';
import { ClassEnrollmentOrmEntity } from './infrastructure/database/typeorm/orm-entities/class-enrollment.orm-entity';
import { ExamOrmEntity } from './infrastructure/database/typeorm/orm-entities/exam.orm-entity';
import { ExamAttemptOrmEntity } from './infrastructure/database/typeorm/orm-entities/exam-attempt.orm-entity';
import { FlashcardSetOrmEntity } from './infrastructure/database/typeorm/orm-entities/flashcard-set.orm-entity';
import { FlashcardOrmEntity } from './infrastructure/database/typeorm/orm-entities/flashcard.orm-entity';
import { FlashcardSetStarOrmEntity } from './infrastructure/database/typeorm/orm-entities/flashcard-set-star.orm-entity';
import { BookmarkOrmEntity } from './infrastructure/database/typeorm/orm-entities/bookmark.orm-entity';
import { QuestionOrmEntity } from './infrastructure/database/typeorm/orm-entities/question.orm-entity';
import { FlashcardProgressOrmEntity } from './infrastructure/database/typeorm/orm-entities/flashcard-progress.orm-entity';
import { FlashcardStudySessionOrmEntity } from './infrastructure/database/typeorm/orm-entities/flashcard-study-session.orm-entity';
import { StudentStudyStatsOrmEntity } from './infrastructure/database/typeorm/orm-entities/student-study-stats.orm-entity';
import { StudentStudySettingsOrmEntity } from './infrastructure/database/typeorm/orm-entities/student-study-settings.orm-entity';
import { StudentWeakTopicOrmEntity } from './infrastructure/database/typeorm/orm-entities/student-weak-topic.orm-entity';
import { StudentStudyPlanOrmEntity } from './infrastructure/database/typeorm/orm-entities/student-study-plan.orm-entity';
import { UserBadgeOrmEntity } from './infrastructure/database/typeorm/orm-entities/user-badge.orm-entity';
import { StudentVerificationRequestOrmEntity } from './infrastructure/database/typeorm/orm-entities/student-verification-request.orm-entity';
import { StudentEmailAllowlistOrmEntity } from './infrastructure/database/typeorm/orm-entities/student-email-allowlist.orm-entity';
import { BoardQuestionOrmEntity } from './infrastructure/database/typeorm/orm-entities/board-question.orm-entity';
import { BoardAnswerOrmEntity } from './infrastructure/database/typeorm/orm-entities/board-answer.orm-entity';
import { BoardUpvoteOrmEntity } from './infrastructure/database/typeorm/orm-entities/board-upvote.orm-entity';
import { OtpTokenEntity } from './infrastructure/database/typeorm/orm-entities/otp-token.orm-entity';

const AppDataSource = new DataSource({
  type: 'postgres',
  url: 'postgresql://educhat:educhat_secret@localhost:5432/educhat',
  entities: [
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
    OtpTokenEntity,
    StudentVerificationRequestOrmEntity,
    StudentEmailAllowlistOrmEntity,
  ],
  synchronize: true,
});

AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized and synchronized!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error during Data Source initialization', err);
    process.exit(1);
  });
