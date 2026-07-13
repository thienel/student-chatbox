import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { RoleOrmEntity } from '../orm-entities/role.orm-entity';
import { PermissionOrmEntity } from '../orm-entities/permission.orm-entity';
import { UserOrmEntity } from '../orm-entities/user.orm-entity';
import { SystemSettingOrmEntity } from '../orm-entities/system-setting.orm-entity';
import { SubjectOrmEntity } from '../orm-entities/subject.orm-entity';
import { ClassOrmEntity } from '../orm-entities/class.orm-entity';
import { ClassEnrollmentOrmEntity } from '../orm-entities/class-enrollment.orm-entity';
import { BoardQuestionOrmEntity } from '../orm-entities/board-question.orm-entity';
import { BoardAnswerOrmEntity } from '../orm-entities/board-answer.orm-entity';
import { BoardUpvoteOrmEntity } from '../orm-entities/board-upvote.orm-entity';
import { FlashcardSetOrmEntity } from '../orm-entities/flashcard-set.orm-entity';
import { FlashcardOrmEntity } from '../orm-entities/flashcard.orm-entity';
import { FlashcardProgressOrmEntity } from '../orm-entities/flashcard-progress.orm-entity';
import { UserBadgeOrmEntity } from '../orm-entities/user-badge.orm-entity';
import { StudentStudyStatsOrmEntity } from '../orm-entities/student-study-stats.orm-entity';
import { StudentWeakTopicOrmEntity } from '../orm-entities/student-weak-topic.orm-entity';
import { ExamOrmEntity } from '../orm-entities/exam.orm-entity';
import { QuestionOrmEntity } from '../orm-entities/question.orm-entity';
import { ExamAttemptOrmEntity } from '../orm-entities/exam-attempt.orm-entity';
import { ChatOrmEntity } from '../orm-entities/chat.orm-entity';
import { MessageOrmEntity } from '../orm-entities/message.orm-entity';
import { DocumentOrmEntity } from '../orm-entities/document.orm-entity';

@Injectable()
export class DatabaseSeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseSeederService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap() {
    await this.seed();
  }

  private async seed() {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const roleRepo = qr.manager.getRepository(RoleOrmEntity);
      const permRepo = qr.manager.getRepository(PermissionOrmEntity);
      const userRepo = qr.manager.getRepository(UserOrmEntity);
      const settingRepo = qr.manager.getRepository(SystemSettingOrmEntity);

      // ─── Roles ────────────────────────────────────────────────────────────
      const roleNames = [
        { name: 'admin', description: 'System administrator' },
        { name: 'lecturer', description: 'Lecturer' },
        { name: 'student', description: 'Student' },
      ];

      const roles: Record<string, RoleOrmEntity> = {};
      for (const r of roleNames) {
        let role = await roleRepo.findOne({ where: { name: r.name } });
        if (!role) {
          role = roleRepo.create({ name: r.name, description: r.description, isSystem: true });
          role = await roleRepo.save(role);
          this.logger.log(`Role created: ${r.name}`);
        }
        roles[r.name] = role;
      }

      // ─── Permissions ──────────────────────────────────────────────────────
      const permissionDefs = [
        { name: 'user:create', description: 'Create user accounts' },
        { name: 'user:read-list', description: 'View user list' },
        { name: 'user:update', description: 'Update user information' },
        { name: 'user:suspend', description: 'Lock/unlock accounts' },
        { name: 'subject:create', description: 'Create subjects' },
        { name: 'subject:update', description: 'Update subjects' },
        { name: 'subject:delete', description: 'Delete subjects' },
        { name: 'subject:read', description: 'View subject information' },
        { name: 'subject:assign-lecturer', description: 'Assign lecturer to subject' },
        { name: 'subject:enroll', description: 'Self-enroll in subject' },
        { name: 'class:manage', description: 'Create and manage classes' },
        { name: 'document:create', description: 'Upload/create documents' },
        { name: 'document:delete', description: 'Delete documents' },
        { name: 'document:read', description: 'View document list' },
        { name: 'ai:summarize-document', description: 'AI summarize a document' },
        { name: 'chat:create', description: 'Create chat session' },
        { name: 'chat:read-own', description: 'View own chats' },
        { name: 'ai:chat-rag', description: 'Use AI RAG chat' },
        { name: 'system:manage-settings', description: 'Manage system settings' },
        { name: 'system:read-audit-log', description: 'View audit log' },
        { name: 'flashcard:create', description: 'Create flashcard sets' },
        { name: 'flashcard:delete', description: 'Delete flashcard sets' },
        { name: 'flashcard:read', description: 'View flashcards' },
        { name: 'flashcard:manage-own', description: 'Share, clone, and manage own flashcard sets' },
        { name: 'flashcard:study', description: 'Study flashcards with spaced repetition' },
        { name: 'ai:generate-flashcard', description: 'AI generate flashcards' },
        { name: 'exam:read', description: 'View exams' },
        { name: 'exam:take', description: 'Take exams' },
        { name: 'exam:create-official', description: 'Create and edit official exams' },
        { name: 'ai:generate-exam', description: 'AI generate exams' },
        { name: 'bookmark:manage', description: 'Manage bookmarks' },
        { name: 'analytics:read-own', description: 'View own subject analytics' },
        { name: 'analytics:read-all', description: 'View all analytics' },
        { name: 'rbac:manage', description: 'Manage roles and permissions' },
        { name: 'user:manage', description: 'Manage user accounts and allowlist' },
      ];

      const permissions: Record<string, PermissionOrmEntity> = {};
      for (const p of permissionDefs) {
        let perm = await permRepo.findOne({ where: { name: p.name } });
        if (!perm) {
          perm = permRepo.create(p);
          perm = await permRepo.save(perm);
        }
        permissions[p.name] = perm;
      }

      // Admin
      const adminPerms = [
        'user:create', 'user:read-list', 'user:update', 'user:suspend', 'user:manage',
        'rbac:manage', 'system:manage-settings', 'system:read-audit-log',
        'subject:create', 'subject:update', 'subject:delete', 'subject:read',
        'subject:assign-lecturer', 'analytics:read-all',
        'exam:read', 'exam:create-official',
      ];
      const adminRole = await roleRepo.findOne({ where: { id: roles['admin'].id }, relations: ['permissions'] });
      adminRole!.permissions = adminPerms.map((n) => permissions[n]);
      await roleRepo.save(adminRole!);

      // Lecturer
      const lecturerPerms = [
        'subject:read', 'class:manage',
        'document:create', 'document:delete', 'document:read',
        'ai:summarize-document',
        'exam:read', 'exam:create-official', 'ai:generate-exam',
        'analytics:read-own',
        'flashcard:create', 'flashcard:delete', 'flashcard:read', 'ai:generate-flashcard',
      ];
      const lecturerRole = await roleRepo.findOne({ where: { id: roles['lecturer'].id }, relations: ['permissions'] });
      lecturerRole!.permissions = lecturerPerms.map((n) => permissions[n]);
      await roleRepo.save(lecturerRole!);

      // Student
      const studentPerms = [
        'subject:read', 'subject:enroll', 'document:read',
        'ai:summarize-document',
        'chat:create', 'chat:read-own', 'ai:chat-rag',
        'flashcard:create', 'flashcard:delete', 'flashcard:read',
        'flashcard:manage-own', 'flashcard:study', 'ai:generate-flashcard',
        'exam:read', 'exam:take', 'ai:generate-exam',
        'bookmark:manage',
      ];
      const studentRole = await roleRepo.findOne({ where: { id: roles['student'].id }, relations: ['permissions'] });
      studentRole!.permissions = studentPerms.map((n) => permissions[n]);
      await roleRepo.save(studentRole!);

      // ─── System Settings ──────────────────────────────────────────────────
      const settingsDefaults = [
        { key: 'ai_daily_limit.student.chat_rag', value: 20, description: 'Daily RAG chat limit for students' },
        { key: 'ai_daily_limit.lecturer.chat_rag', value: 100, description: 'Daily RAG chat limit for lecturers' },
        { key: 'ai_daily_limit.admin.chat_rag', value: -1, description: '-1 = unlimited' },
        { key: 'rag.top_k', value: 5, description: 'Number of chunks retrieved from Qdrant' },
        { key: 'rag.min_score', value: 0.4, description: 'Minimum chunk similarity score (0.4 suits text-embedding-3-small)' },
        { key: 'ai_daily_limit.student.generate_flashcard', value: 5, description: 'Daily flashcard generation limit for students' },
        { key: 'ai_daily_limit.lecturer.generate_flashcard', value: 20, description: 'Daily flashcard generation limit for lecturers' },
        { key: 'ai_daily_limit.admin.generate_flashcard', value: -1, description: 'unlimited' },
        { key: 'ai_daily_limit.student.generate_exam', value: 3, description: 'Daily exam generation limit for students' },
        { key: 'ai_daily_limit.lecturer.generate_exam', value: 10, description: 'Daily exam generation limit for lecturers' },
        { key: 'ai_daily_limit.admin.generate_exam', value: -1, description: 'unlimited' },
        { key: 'ai_daily_limit.student.summarize_document', value: 10, description: 'Daily document summary limit for students' },
        { key: 'ai_daily_limit.lecturer.summarize_document', value: 30, description: 'Daily document summary limit for lecturers' },
        { key: 'ai_daily_limit.admin.summarize_document', value: -1, description: 'unlimited' },
      ];

      for (const s of settingsDefaults) {
        const existing = await settingRepo.findOne({ where: { key: s.key } });
        if (!existing) {
          await settingRepo.save(settingRepo.create({ key: s.key, value: s.value, description: s.description }));
        }
      }

      // ─── Demo Data (opt-in via SEED_DEMO_DATA=true) ───────────────────────
      const shouldSeedDemo = process.env.SEED_DEMO_DATA === 'true';
      if (!shouldSeedDemo) {
        await qr.commitTransaction();
        this.logger.log('Database seed completed (RBAC only, no demo data)');
        return;
      }

      const adminEmail = process.env.DEMO_ADMIN_EMAIL;
      const adminPassword = process.env.DEMO_ADMIN_PASSWORD;
      const lecturerEmail = process.env.DEMO_LECTURER_EMAIL;
      const lecturerPassword = process.env.DEMO_LECTURER_PASSWORD;
      const studentEmail = process.env.DEMO_STUDENT_EMAIL;
      const studentPassword = process.env.DEMO_STUDENT_PASSWORD;
      if (!adminEmail || !adminPassword || !lecturerEmail || !lecturerPassword || !studentEmail || !studentPassword) {
        throw new Error('SEED_DEMO_DATA=true requires all DEMO_*_EMAIL and DEMO_*_PASSWORD variables');
      }

      // ─── Helper ───────────────────────────────────────────────────────────
      const demoPassword = await bcrypt.hash(adminPassword, 12);

      const createUserIfNotExists = async (
        email: string,
        fullName: string,
        roleName: string,
        studentCode?: string,
      ): Promise<UserOrmEntity> => {
        let user = await userRepo.findOne({ where: { email } });
        if (!user) {
          user = userRepo.create({
            email,
            passwordHash: demoPassword,
            fullName,
            roleId: roles[roleName].id,
            status: 'active',
            studentCode: studentCode ?? null,
          });
          await userRepo.save(user);
          this.logger.log(`Demo user created: ${email}`);
        }
        return user;
      };

      // ─── Accounts ─────────────────────────────────────────────────────────
      const adminUser = await createUserIfNotExists(adminEmail, 'System Administrator', 'admin');
      const lecturer1 = await createUserIfNotExists('lecturer1@educhat.local', 'Nguyễn Văn An', 'lecturer');
      const lecturer2 = await createUserIfNotExists('lecturer2@educhat.local', 'Trần Thị Bình', 'lecturer');
      void adminUser;

      const studentNames = [
        'Lê Minh Khoa', 'Phạm Thu Hà', 'Hoàng Đức Mạnh', 'Nguyễn Thị Lan',
        'Trần Quốc Bảo', 'Vũ Thành Long', 'Đỗ Ngọc Ánh', 'Bùi Hữu Tài',
        'Lý Thanh Tùng', 'Mai Thị Huyền',
      ];
      const students: UserOrmEntity[] = [];
      for (let i = 0; i < 10; i++) {
        const idx = i + 1;
        const student = await createUserIfNotExists(
          `student${idx}@educhat.local`,
          studentNames[i],
          'student',
          `SE${170000 + idx}`,
        );
        students.push(student);
      }

      // ─── Subjects (FPT curriculum) ────────────────────────────────────────
      const subjectRepo = qr.manager.getRepository(SubjectOrmEntity);
      const subjectDefs = [
        { code: 'CSI104', name: 'Introduction to Computer Science', description: 'Kỳ 1' },
        { code: 'MAE101', name: 'Mathematics for Engineering', description: 'Kỳ 1' },
        { code: 'CEA201', name: 'Computer Organization and Architecture', description: 'Kỳ 1' },
        { code: 'PRF192', name: 'Programming Fundamentals', description: 'Kỳ 2' },
        { code: 'DRS102', name: 'Discrete Mathematics', description: 'Kỳ 2' },
        { code: 'OSG202', name: 'Operating Systems', description: 'Kỳ 2' },
        { code: 'PRO192', name: 'Object-Oriented Programming', description: 'Kỳ 3' },
        { code: 'DBI202', name: 'Database Systems', description: 'Kỳ 3' },
        { code: 'LAB211', name: 'OOP with Java Lab', description: 'Kỳ 3' },
        { code: 'PRN212', name: 'Windows Programming with C#', description: 'Kỳ 4' },
        { code: 'SWE201c', name: 'Introduction to Software Engineering', description: 'Kỳ 4' },
        { code: 'MAS202', name: 'Applied Mathematics', description: 'Kỳ 4' },
        { code: 'PRN221', name: 'Advanced Cross-Platform Application', description: 'Kỳ 5' },
        { code: 'FER202', name: 'Front-End Web Development with React', description: 'Kỳ 5' },
        { code: 'DBI301c', name: 'Advanced Database', description: 'Kỳ 5' },
        { code: 'SWD391', name: 'Software Architecture and Design', description: 'Kỳ 6' },
        { code: 'PRN231', name: 'Building Cross-Platform Back-End Application with .NET', description: 'Kỳ 6' },
        { code: 'PMG201c', name: 'Project Management', description: 'Kỳ 6' },
        { code: 'SDN302', name: 'Server-Side Development with NodeJS', description: 'Kỳ 7' },
        { code: 'SWT301', name: 'Software Testing', description: 'Kỳ 7' },
        { code: 'EXE201', name: 'Experiential Entrepreneurship', description: 'Kỳ 7' },
      ];

      const subjectMap: Record<string, SubjectOrmEntity> = {};
      for (const def of subjectDefs) {
        let subject = await subjectRepo.findOne({ where: { code: def.code } });
        if (!subject) {
          subject = subjectRepo.create({
            code: def.code,
            name: def.name,
            description: def.description,
            status: 'active',
            createdBy: adminUser.id,
          });
          await subjectRepo.save(subject);
        }
        subjectMap[def.code] = subject;
      }
      this.logger.log(`Seeded ${subjectDefs.length} subjects`);

      // Assign lecturers to subjects
      const assignLecturerSubjects = async (lecturer: UserOrmEntity, codes: string[]) => {
        for (const code of codes) {
          const subject = subjectMap[code];
          if (!subject) continue;
          const exists = await qr.manager.query(
            `SELECT 1 FROM subject_lecturers WHERE subject_id = $1 AND lecturer_id = $2`,
            [subject.id, lecturer.id],
          );
          if (!exists.length) {
            await qr.manager.query(
              `INSERT INTO subject_lecturers (subject_id, lecturer_id) VALUES ($1, $2)`,
              [subject.id, lecturer.id],
            );
          }
        }
      };
      await assignLecturerSubjects(lecturer1, ['SDN302', 'SWD391', 'FER202']);
      await assignLecturerSubjects(lecturer2, ['DBI202', 'PRN212', 'PRO192']);

      // Enroll all 10 students into SDN302 and SWD391
      const enrollStudentsToSubject = async (subjectCode: string) => {
        const subject = subjectMap[subjectCode];
        if (!subject) return;
        for (const student of students) {
          const exists = await qr.manager.query(
            `SELECT 1 FROM subject_enrollments WHERE subject_id = $1 AND student_id = $2`,
            [subject.id, student.id],
          );
          if (!exists.length) {
            await qr.manager.query(
              `INSERT INTO subject_enrollments (subject_id, student_id) VALUES ($1, $2)`,
              [subject.id, student.id],
            );
          }
        }
      };
      await enrollStudentsToSubject('SDN302');
      await enrollStudentsToSubject('SWD391');
      this.logger.log('Enrolled students into SDN302 and SWD391');

      // ─── Classes ──────────────────────────────────────────────────────────
      const classRepo = qr.manager.getRepository(ClassOrmEntity);
      const classEnrollRepo = qr.manager.getRepository(ClassEnrollmentOrmEntity);

      const classPasswordHash = await bcrypt.hash('class123', 10);
      const createClassIfNotExists = async (
        name: string,
        subjectCode: string,
        lecturer: UserOrmEntity,
      ): Promise<ClassOrmEntity> => {
        let cls = await classRepo.findOne({ where: { name } });
        if (!cls) {
          cls = classRepo.create({
            name,
            subjectId: subjectMap[subjectCode].id,
            lecturerId: lecturer.id,
            passwordHash: classPasswordHash,
          });
          await classRepo.save(cls);
          this.logger.log(`Class created: ${name}`);
        }
        return cls;
      };

      const classSDN302 = await createClassIfNotExists('SE1701', 'SDN302', lecturer1);
      const classSWD391 = await createClassIfNotExists('SE1702', 'SWD391', lecturer1);

      const enrollStudentsToClass = async (cls: ClassOrmEntity) => {
        for (const student of students) {
          const exists = await classEnrollRepo.findOne({
            where: { classId: cls.id, studentId: student.id },
          });
          if (!exists) {
            await classEnrollRepo.save(
              classEnrollRepo.create({ classId: cls.id, studentId: student.id }),
            );
          }
        }
      };
      await enrollStudentsToClass(classSDN302);
      await enrollStudentsToClass(classSWD391);
      this.logger.log('Enrolled students into SE1701 and SE1702');

      // ─── Flashcard Sets ───────────────────────────────────────────────────
      const flashcardSetRepo = qr.manager.getRepository(FlashcardSetOrmEntity);
      const flashcardRepo = qr.manager.getRepository(FlashcardOrmEntity);
      const flashcardProgressRepo = qr.manager.getRepository(FlashcardProgressOrmEntity);

      const flashcardSetDefs = [
        {
          subjectCode: 'SDN302',
          title: 'SDN302 - NodeJS Core Concepts',
          description: 'Các khái niệm cốt lõi về NodeJS và ExpressJS',
          createdBy: lecturer1.id,
          isPublic: true,
          cards: [
            { front: 'Event Loop trong NodeJS là gì?', back: 'Event Loop là cơ chế cho phép NodeJS thực hiện các hoạt động non-blocking I/O bằng cách offload các operations xuống system kernel bất cứ khi nào có thể. Nó liên tục kiểm tra call stack và callback queue.' },
            { front: 'Middleware trong ExpressJS là gì?', back: 'Middleware là các hàm có quyền truy cập vào request object (req), response object (res) và hàm next() trong request-response cycle. Chúng có thể execute code, modify req/res, end cycle hoặc gọi next().' },
            { front: 'Khác biệt giữa require() và import trong NodeJS?', back: 'require() là CommonJS (synchronous, dynamic loading). import là ES Modules (static analysis, tree-shaking). NodeJS hiện hỗ trợ cả hai, nhưng ESM cần .mjs hoặc "type: module" trong package.json.' },
            { front: 'REST API là gì? Các HTTP methods chính?', back: 'REST (Representational State Transfer) là kiến trúc API. Các HTTP methods: GET (lấy dữ liệu), POST (tạo mới), PUT (cập nhật toàn bộ), PATCH (cập nhật một phần), DELETE (xóa).' },
            { front: 'JWT (JSON Web Token) có cấu trúc như thế nào?', back: 'JWT gồm 3 phần ngăn cách bởi dấu chấm: Header (thuật toán mã hóa).Payload (claims/data).Signature (chữ ký xác thực). Ví dụ: eyJhbGciOi... .eyJzdWIiOi... .SflKx...' },
            { front: 'Promise và async/await khác nhau như thế nào?', back: 'Promise là object đại diện cho giá trị bất đồng bộ (pending/fulfilled/rejected). async/await là syntax sugar trên Promise, làm cho code bất đồng bộ trông như đồng bộ, dễ đọc hơn.' },
          ],
        },
        {
          subjectCode: 'SDN302',
          title: 'SDN302 - Database & ORM',
          description: 'Kiến thức về kết nối Database và sử dụng ORM trong NodeJS',
          createdBy: students[0].id,
          isPublic: false,
          cards: [
            { front: 'ORM là gì? Lợi ích của ORM?', back: 'ORM (Object-Relational Mapping) là kỹ thuật ánh xạ giữa object trong code và bảng trong database. Lợi ích: viết code thay vì SQL thuần, dễ maintain, hỗ trợ nhiều DB.' },
            { front: 'N+1 query problem là gì?', back: 'N+1 là vấn đề hiệu năng khi query 1 lần để lấy danh sách (N items), rồi query thêm N lần để lấy dữ liệu liên quan của từng item. Giải pháp: eager loading, JOIN, hoặc DataLoader.' },
            { front: 'Transaction trong Database là gì?', back: 'Transaction là tập hợp các operations được thực thi như một đơn vị nguyên tử (ACID). Nếu một operation thất bại, toàn bộ transaction sẽ rollback về trạng thái ban đầu.' },
          ],
        },
        {
          subjectCode: 'SWD391',
          title: 'SWD391 - Design Patterns',
          description: 'Các design pattern quan trọng trong Software Architecture',
          createdBy: lecturer1.id,
          isPublic: true,
          cards: [
            { front: 'Singleton Pattern là gì?', back: 'Singleton đảm bảo một class chỉ có duy nhất một instance và cung cấp một global access point tới instance đó. Thường dùng cho database connection, config, logger.' },
            { front: 'Factory Pattern là gì?', back: 'Factory là creational pattern định nghĩa interface để tạo object nhưng để subclass quyết định class nào sẽ được instantiate. Giúp code linh hoạt và dễ mở rộng.' },
            { front: 'Repository Pattern là gì?', back: 'Repository Pattern tạo ra một lớp trừu tượng giữa domain logic và data access logic. Code business không cần biết dữ liệu đến từ database, API hay file.' },
            { front: 'SOLID là gì?', back: 'S - Single Responsibility, O - Open/Closed, L - Liskov Substitution, I - Interface Segregation, D - Dependency Inversion. 5 nguyên tắc thiết kế hướng đối tượng giúp code dễ maintain và mở rộng.' },
            { front: 'MVC Pattern là gì?', back: 'MVC (Model-View-Controller) chia ứng dụng thành 3 phần: Model (data & logic), View (giao diện), Controller (điều phối). Giúp tách biệt concerns và dễ test.' },
          ],
        },
      ];

      // Track all created flashcard IDs for student1 to make due cards
      const student1DueCardIds: string[] = [];

      for (const setDef of flashcardSetDefs) {
        const existing = await flashcardSetRepo.findOne({
          where: { title: setDef.title, subjectId: subjectMap[setDef.subjectCode].id },
        });
        if (existing) continue;

        const flashcardSet = await flashcardSetRepo.save(
          flashcardSetRepo.create({
            subjectId: subjectMap[setDef.subjectCode].id,
            title: setDef.title,
            description: setDef.description,
            isPublic: setDef.isPublic,
            createdBy: setDef.createdBy,
            starCount: 0,
          }),
        );

        for (let i = 0; i < setDef.cards.length; i++) {
          const card = setDef.cards[i];
          const saved = await flashcardRepo.save(
            flashcardRepo.create({
              setId: flashcardSet.id,
              front: card.front,
              back: card.back,
              position: i,
            }),
          );
          // Collect first 5 cards from NodeJS set to mark as "due today" for student1
          if (setDef.subjectCode === 'SDN302' && setDef.title.includes('NodeJS') && student1DueCardIds.length < 5) {
            student1DueCardIds.push(saved.id);
          }
        }
      }
      this.logger.log('Seeded flashcard sets');

      // ─── Flashcard Progress: mark 5 cards as due today for student1 ──────
      // FSRS-like fields: stability=1, difficulty=5, interval=1, reps=1, lastRating=2, nextReviewAt=now (overdue)
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      for (const cardId of student1DueCardIds) {
        const exists = await flashcardProgressRepo.findOne({
          where: { userId: students[0].id, flashcardId: cardId },
        });
        if (!exists) {
          await flashcardProgressRepo.save(
            flashcardProgressRepo.create({
              userId: students[0].id,
              flashcardId: cardId,
              stability: 1.0,
              difficulty: 5.0,
              interval: 1,
              reps: 1,
              lastRating: 2, // Hard
              lastReviewedAt: yesterday,
              nextReviewAt: yesterday, // overdue → due today
            }),
          );
        }
      }
      this.logger.log(`Seeded ${student1DueCardIds.length} due flashcard progress records for student1`);

      // ─── Student Study Stats (Streak & card counts) ───────────────────────
      const statsRepo = qr.manager.getRepository(StudentStudyStatsOrmEntity);
      const todayStr = now.toISOString().slice(0, 10);

      // student1 (Lê Minh Khoa): active learner, 5-day streak, 120 cards reviewed
      await statsRepo.save(
        statsRepo.create({
          userId: students[0].id,
          currentStreak: 3,
          longestStreak: 5,
          totalSessions: 12,
          totalCardsReviewed: 120,
          lastStudiedDate: todayStr,
          newCardsStudiedToday: 5,
          newCardsTodayDate: todayStr,
        }),
      );

      // student2 (Phạm Thu Hà): moderate learner
      await statsRepo.save(
        statsRepo.create({
          userId: students[1].id,
          currentStreak: 2,
          longestStreak: 3,
          totalSessions: 7,
          totalCardsReviewed: 55,
          lastStudiedDate: todayStr,
          newCardsStudiedToday: 3,
          newCardsTodayDate: todayStr,
        }),
      );

      // student3 (Hoàng Đức Mạnh): just started
      await statsRepo.save(
        statsRepo.create({
          userId: students[2].id,
          currentStreak: 1,
          longestStreak: 1,
          totalSessions: 2,
          totalCardsReviewed: 14,
          lastStudiedDate: todayStr,
          newCardsStudiedToday: 14,
          newCardsTodayDate: todayStr,
        }),
      );
      this.logger.log('Seeded student study stats (streak & card counts)');

      // ─── Exams (Official) ────────────────────────────────────────────────
      const examRepo = qr.manager.getRepository(ExamOrmEntity);
      const questionRepo = qr.manager.getRepository(QuestionOrmEntity);
      const examAttemptRepo = qr.manager.getRepository(ExamAttemptOrmEntity);

      // Create 1 official exam for SWD391 by lecturer1
      let midtermExam = await examRepo.findOne({
        where: { title: '[Official] Midterm Practice – SWD391 Design Patterns', subjectId: subjectMap['SWD391'].id },
      });
      if (!midtermExam) {
        midtermExam = await examRepo.save(
          examRepo.create({
            subjectId: subjectMap['SWD391'].id,
            classId: classSWD391.id,
            title: '[Official] Midterm Practice – SWD391 Design Patterns',
            description: 'Bài kiểm tra giữa kỳ về Design Patterns. Gồm 5 câu trắc nghiệm, thời gian 20 phút.',
            type: 'official',
            difficulty: 'medium',
            durationMinutes: 20,
            questionCount: 5,
            isPublic: true,
            createdBy: lecturer1.id,
          }),
        );

        // 5 exam questions
        const examQuestions = [
          {
            content: 'Singleton Pattern đảm bảo điều gì?',
            options: [{key: 'A', text: 'Một class có thể có nhiều instance'}, {key: 'B', text: 'Một class chỉ có duy nhất một instance'}, {key: 'C', text: 'Một interface có nhiều implementations'}, {key: 'D', text: 'Một object có thể clone được'}],
            correctAnswer: 'B',
            explanation: 'Singleton đảm bảo một class chỉ có duy nhất một instance và cung cấp global access point tới instance đó.',
            topic: 'Singleton Pattern',
          },
          {
            content: 'Factory Pattern thuộc nhóm pattern nào?',
            options: [{key: 'A', text: 'Behavioral'}, {key: 'B', text: 'Structural'}, {key: 'C', text: 'Creational'}, {key: 'D', text: 'Architectural'}],
            correctAnswer: 'C',
            explanation: 'Factory Pattern là Creational Pattern vì nó liên quan đến cách tạo ra objects.',
            topic: 'Factory Pattern',
          },
          {
            content: 'MVC viết tắt của những gì?',
            options: [{key: 'A', text: 'Module-View-Controller'}, {key: 'B', text: 'Model-View-Controller'}, {key: 'C', text: 'Model-View-Component'}, {key: 'D', text: 'Method-View-Class'}],
            correctAnswer: 'B',
            explanation: 'MVC là Model (data & logic) - View (UI) - Controller (điều phối giữa Model và View).',
            topic: 'MVC Pattern',
          },
          {
            content: 'Repository Pattern có tác dụng gì chính?',
            options: [{key: 'A', text: 'Tăng tốc độ query database'}, {key: 'B', text: 'Tạo lớp trừu tượng giữa domain logic và data access'}, {key: 'C', text: 'Quản lý transaction tự động'}, {key: 'D', text: 'Kết nối nhiều database cùng lúc'}],
            correctAnswer: 'B',
            explanation: 'Repository Pattern tách biệt business logic khỏi data access logic, giúp code dễ test và maintain.',
            topic: 'Repository Pattern',
          },
          {
            content: 'Chữ "O" trong SOLID có nghĩa là gì?',
            options: [{key: 'A', text: 'Object Principle'}, {key: 'B', text: 'Optional Dependency'}, {key: 'C', text: 'Open/Closed Principle'}, {key: 'D', text: 'Override Method'}],
            correctAnswer: 'C',
            explanation: 'O là Open/Closed Principle: classes nên mở để mở rộng (extension) nhưng đóng để sửa đổi (modification).',
            topic: 'SOLID',
          },
        ];

        for (let i = 0; i < examQuestions.length; i++) {
          const q = examQuestions[i];
          await questionRepo.save(
            questionRepo.create({
              examId: midtermExam.id,
              content: q.content,
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
              topic: q.topic,
              position: i,
            }),
          );
        }
        this.logger.log('Seeded official exam: Midterm SWD391');
      }

      // Create 1 official exam for SDN302 by lecturer1
      let sdnExam = await examRepo.findOne({
        where: { title: '[Official] NodeJS Fundamentals Quiz', subjectId: subjectMap['SDN302'].id },
      });
      if (!sdnExam) {
        sdnExam = await examRepo.save(
          examRepo.create({
            subjectId: subjectMap['SDN302'].id,
            classId: classSDN302.id,
            title: '[Official] NodeJS Fundamentals Quiz',
            description: 'Quiz kiểm tra kiến thức nền tảng về NodeJS và ExpressJS. Gồm 5 câu, thời gian 15 phút.',
            type: 'official',
            difficulty: 'easy',
            durationMinutes: 15,
            questionCount: 5,
            isPublic: true,
            createdBy: lecturer1.id,
          }),
        );

        const sdnQuestions = [
          {
            content: 'NodeJS chạy trên nền tảng nào?',
            options: [{key: 'A', text: 'V8 JavaScript Engine'}, {key: 'B', text: 'SpiderMonkey'}, {key: 'C', text: 'Chakra'}, {key: 'D', text: 'Hermes'}],
            correctAnswer: 'A',
            explanation: 'NodeJS được xây dựng trên V8 JavaScript Engine của Google Chrome.',
            topic: 'NodeJS Basics',
          },
          {
            content: 'npm là viết tắt của gì?',
            options: [{key: 'A', text: 'Node Package Module'}, {key: 'B', text: 'Node Package Manager'}, {key: 'C', text: 'Node Program Manager'}, {key: 'D', text: 'New Package Manager'}],
            correctAnswer: 'B',
            explanation: 'npm = Node Package Manager, công cụ quản lý thư viện của Node.js.',
            topic: 'NodeJS Basics',
          },
          {
            content: 'HTTP method nào được dùng để tạo mới resource?',
            options: [{key: 'A', text: 'GET'}, {key: 'B', text: 'PUT'}, {key: 'C', text: 'POST'}, {key: 'D', text: 'PATCH'}],
            correctAnswer: 'C',
            explanation: 'POST được dùng để tạo mới resource. PUT dùng để cập nhật toàn bộ, PATCH cập nhật một phần.',
            topic: 'REST API',
          },
          {
            content: 'Middleware trong Express nhận bao nhiêu tham số?',
            options: [{key: 'A', text: '1'}, {key: 'B', text: '2'}, {key: 'C', text: '3'}, {key: 'D', text: '4'}],
            correctAnswer: 'C',
            explanation: 'Middleware thông thường nhận 3 tham số: (req, res, next). Error handling middleware nhận 4: (err, req, res, next).',
            topic: 'Middleware',
          },
          {
            content: 'async/await là syntax sugar của gì?',
            options: [{key: 'A', text: 'Callback'}, {key: 'B', text: 'Promise'}, {key: 'C', text: 'Event Emitter'}, {key: 'D', text: 'Generator'}],
            correctAnswer: 'B',
            explanation: 'async/await là syntax sugar trên Promise, giúp viết code bất đồng bộ dễ đọc hơn.',
            topic: 'Async Programming',
          },
        ];

        for (let i = 0; i < sdnQuestions.length; i++) {
          const q = sdnQuestions[i];
          await questionRepo.save(
            questionRepo.create({
              examId: sdnExam.id,
              content: q.content,
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
              topic: q.topic,
              position: i,
            }),
          );
        }
        this.logger.log('Seeded official exam: NodeJS Fundamentals Quiz');
      }

      // ─── Exam Attempts ────────────────────────────────────────────────────
      // student1 đã làm bài thi SWD391 và đạt 6/10 (3/5 câu đúng)
      const student1SWDAttempt = await examAttemptRepo.findOne({
        where: { examId: midtermExam.id, userId: students[0].id, status: 'completed' },
      });
      if (!student1SWDAttempt) {
        const completedAt = new Date(now);
        completedAt.setDate(completedAt.getDate() - 2); // 2 ngày trước
        const startedAt = new Date(completedAt);
        startedAt.setMinutes(startedAt.getMinutes() - 15);
        await examAttemptRepo.save(
          examAttemptRepo.create({
            examId: midtermExam.id,
            userId: students[0].id,
            answers: { [savedQuestions[0].id]: 'B', [savedQuestions[1].id]: 'A', [savedQuestions[2].id]: 'B', [savedQuestions[3].id]: 'B', [savedQuestions[4].id]: 'C' }, // 3 đúng (B,B,B correct), score 6/10
            score: 6,
            totalQuestions: 5,
            correctCount: 3,
            status: 'completed',
            completedAt,
            timeSpentSecs: 900,
          }),
        );
        this.logger.log('Seeded exam attempt for student1 (SWD391 midterm)');
      }

      // student2 đã làm bài NodeJS và đạt 8/10 (4/5 câu đúng)
      const student2SDNAttempt = await examAttemptRepo.findOne({
        where: { examId: sdnExam.id, userId: students[1].id, status: 'completed' },
      });
      if (!student2SDNAttempt) {
        const completedAt = new Date(now);
        completedAt.setDate(completedAt.getDate() - 1);
        await examAttemptRepo.save(
          examAttemptRepo.create({
            examId: sdnExam.id,
            userId: students[1].id,
            answers: { [savedQuestions[0].id]: 'A', [savedQuestions[1].id]: 'B', [savedQuestions[2].id]: 'C', [savedQuestions[3].id]: 'C', [savedQuestions[4].id]: 'B' }, // 4 đúng
            score: 8,
            totalQuestions: 5,
            correctCount: 4,
            status: 'completed',
            completedAt,
            timeSpentSecs: 720,
          }),
        );
        this.logger.log('Seeded exam attempt for student2 (SDN302 quiz)');
      }

      // student3 làm bài NodeJS đạt 10/10 (perfect score → badge exam_perfect)
      const student3SDNAttempt = await examAttemptRepo.findOne({
        where: { examId: sdnExam.id, userId: students[2].id, status: 'completed' },
      });
      if (!student3SDNAttempt) {
        const completedAt = new Date(now);
        completedAt.setHours(completedAt.getHours() - 3);
        await examAttemptRepo.save(
          examAttemptRepo.create({
            examId: sdnExam.id,
            userId: students[2].id,
            answers: { [savedQuestions[0].id]: 'A', [savedQuestions[1].id]: 'B', [savedQuestions[2].id]: 'C', [savedQuestions[3].id]: 'C', [savedQuestions[4].id]: 'B' }, // 5 đúng
            score: 10,
            totalQuestions: 5,
            correctCount: 5,
            status: 'completed',
            completedAt,
            timeSpentSecs: 600,
          }),
        );
        this.logger.log('Seeded exam attempt for student3 (SDN302 perfect score)');
      }

      // ─── Weak Topics ──────────────────────────────────────────────────────
      const weakTopicRepo = qr.manager.getRepository(StudentWeakTopicOrmEntity);

      // student1 yếu "Factory Pattern" và "SOLID" từ bài thi SWD391
      const weakTopicDefs = [
        {
          userId: students[0].id,
          subjectId: subjectMap['SWD391'].id,
          topic: 'Factory Pattern',
          classification: 'weak' as const,
          totalQuestions: 3,
          correctCount: 1,
          correctRate: 0.33,
        },
        {
          userId: students[0].id,
          subjectId: subjectMap['SWD391'].id,
          topic: 'SOLID',
          classification: 'developing' as const,
          totalQuestions: 2,
          correctCount: 1,
          correctRate: 0.5,
        },
        {
          userId: students[0].id,
          subjectId: subjectMap['SDN302'].id,
          topic: 'Middleware',
          classification: 'developing' as const,
          totalQuestions: 4,
          correctCount: 2,
          correctRate: 0.5,
        },
      ];

      for (const wt of weakTopicDefs) {
        const exists = await weakTopicRepo.findOne({
          where: { userId: wt.userId, subjectId: wt.subjectId, topic: wt.topic },
        });
        if (!exists) {
          await weakTopicRepo.save(
            weakTopicRepo.create({
              ...wt,
              lastUpdatedAt: now,
            }),
          );
        }
      }
      this.logger.log('Seeded student weak topics for student1');

      // ─── Dummy Documents ──────────────────────────────────────────────────
      const documentRepo = qr.manager.getRepository(DocumentOrmEntity);

      const documentDefs = [
        {
          subjectId: subjectMap['SWD391'].id,
          originalName: 'SWD391_Syllabus_Fall2024.pdf',
          storedPath: 'uploads/demo/swd391_syllabus.pdf',
          mimeType: 'application/pdf',
          fileSizeBytes: 204800,
          uploadedBy: lecturer1.id,
          summary: 'Tài liệu mô tả tổng quan môn học SWD391 - Software Architecture and Design. Bao gồm: Mục tiêu môn học, các chủ đề chính (Design Patterns: Creational, Structural, Behavioral), lịch học, hình thức đánh giá (Midterm 30%, Final 40%, Project 30%), và danh sách tài liệu tham khảo.',
        },
        {
          subjectId: subjectMap['SWD391'].id,
          originalName: 'Design_Patterns_GoF_Summary.pdf',
          storedPath: 'uploads/demo/design_patterns_summary.pdf',
          mimeType: 'application/pdf',
          fileSizeBytes: 512000,
          uploadedBy: lecturer1.id,
          summary: 'Tóm tắt 23 Design Patterns từ cuốn "Gang of Four" (GoF). Phân loại: Creational Patterns (Singleton, Factory, Abstract Factory, Builder, Prototype), Structural Patterns (Adapter, Bridge, Composite, Decorator, Facade, Flyweight, Proxy), Behavioral Patterns (Chain of Responsibility, Command, Iterator, Mediator, Memento, Observer, State, Strategy, Template Method, Visitor).',
        },
        {
          subjectId: subjectMap['SDN302'].id,
          originalName: 'SDN302_Lab_Guide_NodeJS_Express.pdf',
          storedPath: 'uploads/demo/sdn302_lab_guide.pdf',
          mimeType: 'application/pdf',
          fileSizeBytes: 358400,
          uploadedBy: lecturer1.id,
          summary: 'Hướng dẫn thực hành môn SDN302 với NodeJS và ExpressJS. Gồm 5 Lab: Lab 1 - Cài đặt môi trường và Hello World, Lab 2 - REST API cơ bản, Lab 3 - Middleware và Authentication với JWT, Lab 4 - Kết nối Database với TypeORM, Lab 5 - Deploy lên cloud với Docker.',
        },
      ];

      for (const doc of documentDefs) {
        const exists = await documentRepo.findOne({
          where: { originalName: doc.originalName, subjectId: doc.subjectId },
        });
        if (!exists) {
          const summaryGeneratedAt = new Date(now);
          summaryGeneratedAt.setDate(summaryGeneratedAt.getDate() - 3);
          await documentRepo.save(
            documentRepo.create({
              ...doc,
              status: 'completed',
              chunkCount: 12,
              summaryGeneratedAt,
            }),
          );
        }
      }
      this.logger.log('Seeded dummy documents with AI summaries');

      // ─── Chat History ─────────────────────────────────────────────────────
      const chatRepo = qr.manager.getRepository(ChatOrmEntity);
      const messageRepo = qr.manager.getRepository(MessageOrmEntity);

      const chatDefs = [
        {
          userId: students[0].id,
          subjectId: subjectMap['SWD391'].id,
          classId: classSWD391.id,
          title: 'Giải thích Singleton Pattern',
          messages: [
            { role: 'user', content: 'Em chưa hiểu rõ Singleton Pattern. Thầy giải thích giúp em với ạ?' },
            { role: 'assistant', content: 'Singleton Pattern là một Creational Design Pattern đảm bảo rằng một class chỉ có **duy nhất một instance** trong suốt vòng đời của chương trình.\n\n**Khi nào dùng Singleton?**\n- Database connection pool\n- Configuration manager\n- Logger\n- Cache manager\n\n**Ví dụ TypeScript:**\n```typescript\nclass DatabaseConnection {\n  private static instance: DatabaseConnection;\n  \n  private constructor() {\n    // private constructor ngăn khởi tạo trực tiếp\n  }\n  \n  static getInstance(): DatabaseConnection {\n    if (!DatabaseConnection.instance) {\n      DatabaseConnection.instance = new DatabaseConnection();\n    }\n    return DatabaseConnection.instance;\n  }\n}\n```\n\nBạn có thể gọi `DatabaseConnection.getInstance()` bất cứ đâu và luôn nhận được cùng một instance.' },
            { role: 'user', content: 'Vậy Singleton có nhược điểm gì không ạ?' },
            { role: 'assistant', content: 'Câu hỏi hay! Singleton có một số nhược điểm cần lưu ý:\n\n1. **Khó test (Unit Testing)**: Vì Singleton giữ trạng thái global, các test cases có thể ảnh hưởng lẫn nhau.\n\n2. **Vi phạm Single Responsibility**: Class vừa quản lý logic của mình vừa quản lý lifecycle của instance.\n\n3. **Vấn đề với multithreading**: Trong môi trường đa luồng, nếu không xử lý cẩn thận có thể tạo ra nhiều instances.\n\n4. **Tight coupling**: Code phụ thuộc trực tiếp vào Singleton, khó thay thế sau này.\n\n**Giải pháp thay thế**: Dùng Dependency Injection (DI) thay vì Singleton thuần túy. Các framework như NestJS đã xử lý điều này với `@Injectable({ scope: Scope.DEFAULT })`.' },
          ],
        },
        {
          userId: students[0].id,
          subjectId: subjectMap['SDN302'].id,
          classId: classSDN302.id,
          title: 'Hỏi về JWT Authentication',
          messages: [
            { role: 'user', content: 'Thầy ơi em muốn hiểu rõ hơn về JWT. Tại sao không dùng session thông thường ạ?' },
            { role: 'assistant', content: 'JWT (JSON Web Token) và Session đều là cách xác thực người dùng, nhưng có sự khác biệt quan trọng:\n\n**Session (Stateful)**:\n- Server lưu session data trong memory/database\n- Client chỉ giữ session ID (cookie)\n- Dễ revoke (xóa session)\n- Khó scale horizontal\n\n**JWT (Stateless)**:\n- Server không lưu gì cả\n- Client giữ toàn bộ token (chứa user info)\n- Khó revoke trước hạn\n- Dễ scale, phù hợp microservices\n\n**Cấu trúc JWT:**\n```\nheader.payload.signature\n```\n\nVới REST API và microservices như dự án SDN302, JWT phù hợp hơn vì stateless và dễ scale.' },
          ],
        },
        {
          userId: students[1].id,
          subjectId: subjectMap['SDN302'].id,
          classId: classSDN302.id,
          title: 'Giải thích Event Loop',
          messages: [
            { role: 'user', content: 'Em không hiểu tại sao NodeJS single-thread mà lại xử lý được nhiều request?' },
            { role: 'assistant', content: 'Đây là câu hỏi cốt lõi về NodeJS! NodeJS single-thread nhưng vẫn handle được nhiều request nhờ **Event Loop** và **Non-blocking I/O**.\n\n**Cách hoạt động:**\n1. Request đến → NodeJS nhận và bắt đầu xử lý\n2. Nếu cần I/O (đọc file, query DB) → đẩy xuống OS kernel xử lý\n3. NodeJS **không chờ** → tiếp tục nhận request mới\n4. Khi I/O xong → callback được đẩy vào Event Queue\n5. Event Loop kiểm tra Call Stack trống → thực thi callback\n\nNhờ vậy, 1 thread có thể handle hàng nghìn concurrent requests, miễn là không có CPU-intensive tasks blocking thread chính.' },
          ],
        },
      ];

      for (const chatDef of chatDefs) {
        const existingChat = await chatRepo.findOne({
          where: { userId: chatDef.userId, title: chatDef.title },
        });
        if (existingChat) continue;

        const chat = await chatRepo.save(
          chatRepo.create({
            userId: chatDef.userId,
            subjectId: chatDef.subjectId,
            classId: chatDef.classId,
            title: chatDef.title,
          }),
        );

        for (const msg of chatDef.messages) {
          await messageRepo.save(
            messageRepo.create({
              chatId: chat.id,
              role: msg.role,
              content: msg.content,
            }),
          );
        }
      }
      this.logger.log('Seeded chat history');

      // ─── Question Board ───────────────────────────────────────────────────
      const boardQuestionRepo = qr.manager.getRepository(BoardQuestionOrmEntity);
      const answerRepo = qr.manager.getRepository(BoardAnswerOrmEntity);
      const upvoteRepo = qr.manager.getRepository(BoardUpvoteOrmEntity);

      const questionDefs = [
        {
          classId: classSDN302.id,
          authorIdx: 0,
          title: 'REST API khác gì với GraphQL?',
          body: 'Thầy ơi em thấy nhiều project dùng GraphQL, vậy khi nào nên chọn REST khi nào nên chọn GraphQL ạ? Em đang làm dự án SDN302 và đang phân vân không biết chọn cái nào.',
          answers: [
            {
              authorId: lecturer1.id,
              body: 'Câu hỏi hay! **REST** phù hợp khi API đơn giản, team nhỏ, client không cần linh hoạt về dữ liệu. **GraphQL** phù hợp khi có nhiều loại client (web, mobile) cần dữ liệu khác nhau từ cùng endpoint.\n\nVới đồ án SDN302, các em cứ dùng REST cho gọn, vì scope dự án còn nhỏ.',
              isPinned: true,
              upvoterIdxs: [1, 2, 3, 4],
            },
            {
              authorId: students[1].id,
              body: 'Em cũng đang tìm hiểu vấn đề này. Em thấy GraphQL có thể giảm over-fetching và under-fetching, nhưng setup phức tạp hơn REST nhiều. Cảm ơn thầy đã giải thích!',
              isPinned: false,
              upvoterIdxs: [0, 2],
            },
          ],
          upvoterIdxs: [1, 2, 3, 4, 5],
        },
        {
          classId: classSDN302.id,
          authorIdx: 2,
          title: 'Middleware trong ExpressJS hoạt động như thế nào?',
          body: 'Em chưa hiểu rõ về middleware, thầy có thể giải thích luồng chạy của middleware không ạ? Đặc biệt là error handling middleware.',
          answers: [
            {
              authorId: lecturer1.id,
              body: 'Middleware trong Express là các hàm có dạng `(req, res, next) => {}`. Chúng chạy **tuần tự** theo thứ tự khai báo.\n\n**Error handling middleware** đặc biệt hơn, nhận 4 tham số `(err, req, res, next)` và phải đặt **cuối cùng** sau tất cả routes.',
              isPinned: true,
              upvoterIdxs: [0, 1, 3, 5, 6],
            },
          ],
          upvoterIdxs: [0, 1, 3, 4, 6, 7],
        },
        {
          classId: classSDN302.id,
          authorIdx: 4,
          title: 'JWT Token có thể bị hack không?',
          body: 'Em nghe nói JWT không an toàn nếu không dùng HTTPS. Vậy ngoài HTTPS ra thì còn có những cách nào để bảo mật JWT không ạ?',
          answers: [],
          upvoterIdxs: [0, 2, 3],
        },
        {
          classId: classSDN302.id,
          authorIdx: 6,
          title: 'Mongoose và TypeORM khác nhau điểm nào?',
          body: 'Em thấy bài lab dùng Mongoose với MongoDB, nhưng thầy lại nói dự án nên dùng TypeORM. Em muốn hỏi tại sao và khi nào nên chọn cái nào ạ?',
          answers: [
            {
              authorId: students[1].id,
              body: 'Theo mình biết thì Mongoose dành cho MongoDB (NoSQL), còn TypeORM hỗ trợ cả SQL lẫn NoSQL. Dự án mà cần quan hệ phức tạp giữa các bảng thì TypeORM với PostgreSQL sẽ phù hợp hơn.',
              isPinned: false,
              upvoterIdxs: [6, 7, 8],
            },
          ],
          upvoterIdxs: [0, 1, 5, 8, 9],
        },
        {
          classId: classSDN302.id,
          authorIdx: 8,
          title: 'Cách deploy NodeJS lên server production?',
          body: 'Đồ án em sắp xong rồi, thầy có thể hướng dẫn qua cách deploy lên server không ạ? Em thấy có nhiều cách như PM2, Docker, hoặc dùng cloud service. Cái nào phù hợp cho project nhỏ ạ?',
          answers: [],
          upvoterIdxs: [0, 1, 2, 3, 4, 5, 6],
        },
      ];

      for (const qDef of questionDefs) {
        const existing = await boardQuestionRepo.findOne({
          where: { classId: qDef.classId, title: qDef.title },
        });
        if (existing) continue;

        const question = await boardQuestionRepo.save(
          boardQuestionRepo.create({
            classId: qDef.classId,
            authorId: students[qDef.authorIdx].id,
            title: qDef.title,
            body: qDef.body,
            status: qDef.answers.length > 0 ? 'answered' : 'open',
            upvoteCount: qDef.upvoterIdxs.length,
            answerCount: qDef.answers.length,
          }),
        );

        for (const idx of qDef.upvoterIdxs) {
          const voter = students[idx];
          if (voter.id === students[qDef.authorIdx].id) continue;
          await upvoteRepo.save(
            upvoteRepo.create({ userId: voter.id, targetType: 'question', targetId: question.id }),
          );
        }

        for (const aDef of qDef.answers) {
          const answer = await answerRepo.save(
            answerRepo.create({
              questionId: question.id,
              authorId: aDef.authorId,
              body: aDef.body,
              isPinned: aDef.isPinned,
              upvoteCount: aDef.upvoterIdxs.length,
            }),
          );

          for (const idx of aDef.upvoterIdxs) {
            await upvoteRepo.save(
              upvoteRepo.create({ userId: students[idx].id, targetType: 'answer', targetId: answer.id }),
            );
          }
        }
      }
      this.logger.log('Seeded board questions and answers');

      // ─── Badges ───────────────────────────────────────────────────────────
      const badgeRepo = qr.manager.getRepository(UserBadgeOrmEntity);

      // Seed badges that are logically consistent with seeded data:
      // first_question: students who posted board questions (idx 0,2,4,6,8)
      // first_session:  students who have study stats (idx 0,1,2)
      // streak_3:       student1 has longestStreak=5 → qualifies
      // cards_100:      student1 has 120 cards reviewed → qualifies
      // exam_perfect:   student3 scored 10/10 → qualifies
      const badgeDefs = [
        { userId: students[0].id, badgeId: 'first_question' },
        { userId: students[2].id, badgeId: 'first_question' },
        { userId: students[4].id, badgeId: 'first_question' },
        { userId: students[6].id, badgeId: 'first_question' },
        { userId: students[8].id, badgeId: 'first_question' },
        { userId: students[0].id, badgeId: 'first_session' },
        { userId: students[1].id, badgeId: 'first_session' },
        { userId: students[2].id, badgeId: 'first_session' },
        { userId: students[0].id, badgeId: 'streak_3' },
        { userId: students[0].id, badgeId: 'cards_100' },
        { userId: students[2].id, badgeId: 'exam_perfect' },
      ];

      for (const bd of badgeDefs) {
        const exists = await badgeRepo.findOne({ where: { userId: bd.userId, badgeId: bd.badgeId } });
        if (!exists) {
          await badgeRepo.save(badgeRepo.create({ userId: bd.userId, badgeId: bd.badgeId }));
        }
      }
      this.logger.log('Seeded user badges');

      this.logger.log('======================================================');
      this.logger.log('=== DEMO ACCOUNTS (password: Demo@123456)          ===');
      this.logger.log('======================================================');
      this.logger.log('  admin:      admin@educhat.local');
      this.logger.log('  lecturer1:  lecturer1@educhat.local');
      this.logger.log('  lecturer2:  lecturer2@educhat.local');
      this.logger.log('  students:   student1@educhat.local ... student10@educhat.local');
      this.logger.log('------------------------------------------------------');
      this.logger.log('  student1 profile: streak=3, cards=120, badges: first_question/first_session/streak_3/cards_100');
      this.logger.log('  student3 profile: exam_perfect badge (scored 10/10 on NodeJS quiz)');
      this.logger.log('======================================================');

      await qr.commitTransaction();
      this.logger.log('Database seed completed successfully');
    } catch (error) {
      await qr.rollbackTransaction();
      this.logger.error('Database seed failed', error);
      throw error;
    } finally {
      await qr.release();
    }
  }
}
