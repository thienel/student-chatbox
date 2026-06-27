import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { RoleOrmEntity } from '../orm-entities/role.orm-entity';
import { PermissionOrmEntity } from '../orm-entities/permission.orm-entity';
import { UserOrmEntity } from '../orm-entities/user.orm-entity';
import { SystemSettingOrmEntity } from '../orm-entities/system-setting.orm-entity';

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

      // Roles
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

      // Permissions
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
        { name: 'document:upload', description: 'Upload documents' },
        { name: 'document:delete', description: 'Delete documents' },
        { name: 'document:read', description: 'View document list' },
        { name: 'chat:create', description: 'Create chat session' },
        { name: 'chat:read-own', description: 'View own chats' },
        { name: 'ai:chat-rag', description: 'Use AI RAG chat' },
        { name: 'system:manage-settings', description: 'Manage system settings' },
        { name: 'system:read-audit-log', description: 'View audit log' },
        { name: 'flashcard:create', description: 'Create flashcard sets' },
        { name: 'flashcard:delete', description: 'Delete flashcard sets' },
        { name: 'flashcard:read', description: 'View flashcards' },
        { name: 'flashcard:manage-own', description: 'Share, clone, and manage own flashcard sets' },
        { name: 'ai:generate-flashcard', description: 'AI generate flashcards' },
        { name: 'exam:read', description: 'View exams' },
        { name: 'exam:take', description: 'Take exams' },
        { name: 'exam:create-official', description: 'Create and edit official exams' },
        { name: 'ai:generate-exam', description: 'AI generate exams' },
        { name: 'bookmark:manage', description: 'Manage bookmarks' },
        { name: 'analytics:read-own', description: 'View own subject analytics' },
        { name: 'analytics:read-all', description: 'View all analytics' },
        { name: 'rbac:manage', description: 'Manage roles and permissions' },
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

      // Admin: subject lifecycle + platform administration only. Sees no
      // content inside a subject (documents/chat/flashcards/exams). Keeps
      // rbac:manage, so it can self-grant when truly needed.
      const adminPerms = [
        'user:create', 'user:read-list', 'user:update', 'user:suspend',
        'rbac:manage', 'system:manage-settings', 'system:read-audit-log',
        'subject:create', 'subject:update', 'subject:delete', 'subject:read',
        'subject:assign-lecturer', 'analytics:read-all',
        'exam:read', 'exam:create-official',
      ];
      const adminRole = await roleRepo.findOne({
        where: { id: roles['admin'].id },
        relations: ['permissions'],
      });
      adminRole!.permissions = adminPerms.map((n) => permissions[n]);
      await roleRepo.save(adminRole!);

      // Lecturer: runs the class — upload documents, manage classes & their
      // students, and view class stats. Does not study (no chat/flashcards/
      // exams).
      const lecturerPerms = [
        'subject:read', 'class:manage',
        'document:upload', 'document:delete', 'document:read',
        'exam:read', 'exam:create-official',
        'analytics:read-own',
      ];
      const lecturerRole = await roleRepo.findOne({
        where: { id: roles['lecturer'].id },
        relations: ['permissions'],
      });
      lecturerRole!.permissions = lecturerPerms.map((n) => permissions[n]);
      await roleRepo.save(lecturerRole!);

      // Student: studies the class material — reads documents, chats, and
      // creates their own private flashcards & exams from the class content.
      const studentPerms = [
        'subject:read', 'subject:enroll', 'document:read',
        'chat:create', 'chat:read-own', 'ai:chat-rag',
        'flashcard:create', 'flashcard:delete', 'flashcard:read',
        'flashcard:manage-own', 'ai:generate-flashcard',
        'exam:read', 'exam:take', 'ai:generate-exam',
        'bookmark:manage',
      ];
      const studentRole = await roleRepo.findOne({
        where: { id: roles['student'].id },
        relations: ['permissions'],
      });
      studentRole!.permissions = studentPerms.map((n) => permissions[n]);
      await roleRepo.save(studentRole!);

      // System Settings
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
      ];

      for (const s of settingsDefaults) {
        const existing = await settingRepo.findOne({ where: { key: s.key } });
        if (!existing) {
          await settingRepo.save(settingRepo.create({ key: s.key, value: s.value, description: s.description }));
        }
      }

      // Default admin user
      const adminEmail = 'admin@educhat.local';
      let adminUser = await userRepo.findOne({ where: { email: adminEmail } });
      if (!adminUser) {
        const passwordHash = await bcrypt.hash('Admin@123456', 12);
        adminUser = userRepo.create({
          email: adminEmail,
          passwordHash,
          fullName: 'System Administrator',
          roleId: roles['admin'].id,
          status: 'active',
        });
        await userRepo.save(adminUser);
        this.logger.log('Admin user created: admin@educhat.local / Admin@123456');
      }

      await qr.commitTransaction();
      this.logger.log('Database seed completed');
    } catch (error) {
      await qr.rollbackTransaction();
      this.logger.error('Database seed failed', error);
    } finally {
      await qr.release();
    }
  }
}
