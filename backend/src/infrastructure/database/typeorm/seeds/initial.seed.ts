import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { RoleOrmEntity } from '../orm-entities/role.orm-entity';
import { PermissionOrmEntity } from '../orm-entities/permission.orm-entity';
import { UserOrmEntity } from '../orm-entities/user.orm-entity';
import { SystemSettingOrmEntity } from '../orm-entities/system-setting.orm-entity';

dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [RoleOrmEntity, PermissionOrmEntity, UserOrmEntity, SystemSettingOrmEntity],
  synchronize: true,
});

async function seed() {
  await dataSource.initialize();
  const qr = dataSource.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();

  try {
    const roleRepo = qr.manager.getRepository(RoleOrmEntity);
    const permRepo = qr.manager.getRepository(PermissionOrmEntity);
    const userRepo = qr.manager.getRepository(UserOrmEntity);
    const settingRepo = qr.manager.getRepository(SystemSettingOrmEntity);

    // Roles
    const roleNames = [
      { name: 'admin', description: 'Quản trị viên hệ thống' },
      { name: 'lecturer', description: 'Giảng viên' },
      { name: 'student', description: 'Sinh viên' },
    ];

    const roles: Record<string, RoleOrmEntity> = {};
    for (const r of roleNames) {
      let role = await roleRepo.findOne({ where: { name: r.name } });
      if (!role) {
        role = roleRepo.create({ name: r.name, description: r.description, isSystem: true });
        role = await roleRepo.save(role);
      }
      roles[r.name] = role;
    }

    // Permissions
    const permissionDefs = [
      { name: 'user:create', description: 'Tạo tài khoản người dùng' },
      { name: 'user:read-list', description: 'Xem danh sách người dùng' },
      { name: 'user:update', description: 'Cập nhật thông tin người dùng' },
      { name: 'user:suspend', description: 'Khoá/mở khoá tài khoản' },
      { name: 'subject:create', description: 'Tạo môn học' },
      { name: 'subject:update', description: 'Cập nhật môn học' },
      { name: 'subject:delete', description: 'Xoá môn học' },
      { name: 'subject:read', description: 'Xem thông tin môn học' },
      { name: 'subject:assign-lecturer', description: 'Assign giảng viên vào môn học' },
      { name: 'subject:enroll', description: 'Tự đăng ký môn học' },
      { name: 'document:upload', description: 'Upload tài liệu' },
      { name: 'document:delete', description: 'Xoá tài liệu' },
      { name: 'document:read', description: 'Xem danh sách tài liệu' },
      { name: 'chat:create', description: 'Tạo chat session' },
      { name: 'chat:read-own', description: 'Xem chat của mình' },
      { name: 'ai:chat-rag', description: 'Sử dụng AI chat RAG' },
      { name: 'system:manage-settings', description: 'Quản lý cài đặt hệ thống' },
      { name: 'system:read-audit-log', description: 'Xem audit log' },
      // Flashcard
      { name: 'flashcard:create', description: 'Tạo bộ flashcard' },
      { name: 'flashcard:delete', description: 'Xoá bộ flashcard' },
      { name: 'flashcard:read', description: 'Xem flashcard' },
      { name: 'ai:generate-flashcard', description: 'AI tạo flashcard' },
      // Exam
      { name: 'exam:read', description: 'Xem đề thi' },
      { name: 'exam:take', description: 'Làm bài thi' },
      { name: 'ai:generate-exam', description: 'AI tạo đề thi' },
      // Bookmark
      { name: 'bookmark:manage', description: 'Quản lý bookmarks' },
      // Analytics
      { name: 'analytics:read-own', description: 'Xem analytics môn học của mình' },
      { name: 'analytics:read-all', description: 'Xem toàn bộ analytics' },
      // RBAC
      { name: 'rbac:manage', description: 'Quản lý roles và permissions' },
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

    // Admin: all permissions
    const adminRole = await roleRepo.findOne({
      where: { id: roles['admin'].id },
      relations: ['permissions'],
    });
    adminRole!.permissions = Object.values(permissions);
    await roleRepo.save(adminRole!);

    // Lecturer permissions
    const lecturerPerms = [
      'subject:read',
      'document:upload',
      'document:delete',
      'document:read',
      'chat:create',
      'chat:read-own',
      'ai:chat-rag',
      'flashcard:create',
      'flashcard:delete',
      'flashcard:read',
      'ai:generate-flashcard',
      'exam:read',
      'exam:take',
      'ai:generate-exam',
      'bookmark:manage',
      'analytics:read-own',
    ];
    const lecturerRole = await roleRepo.findOne({
      where: { id: roles['lecturer'].id },
      relations: ['permissions'],
    });
    lecturerRole!.permissions = lecturerPerms.map((n) => permissions[n]);
    await roleRepo.save(lecturerRole!);

    // Student permissions
    const studentPerms = [
      'subject:read',
      'subject:enroll',
      'document:read',
      'chat:create',
      'chat:read-own',
      'ai:chat-rag',
      'flashcard:read',
      'ai:generate-flashcard',
      'exam:read',
      'exam:take',
      'ai:generate-exam',
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
      { key: 'ai_daily_limit.student.chat_rag', value: 20, description: 'Số lượt chat RAG / ngày cho sinh viên' },
      { key: 'ai_daily_limit.lecturer.chat_rag', value: 100, description: 'Số lượt chat RAG / ngày cho giảng viên' },
      { key: 'ai_daily_limit.admin.chat_rag', value: -1, description: '-1 = unlimited' },
      { key: 'rag.top_k', value: 5, description: 'Số chunks lấy từ Qdrant' },
      { key: 'rag.min_score', value: 0.4, description: 'Ngưỡng score tối thiểu của chunk (0.4 phù hợp với text-embedding-3-small)' },
      // Flashcard limits
      { key: 'ai_daily_limit.student.generate_flashcard', value: 5, description: 'Số lần generate flashcard / ngày cho SV' },
      { key: 'ai_daily_limit.lecturer.generate_flashcard', value: 20, description: 'Số lần generate flashcard / ngày cho GV' },
      { key: 'ai_daily_limit.admin.generate_flashcard', value: -1, description: 'unlimited' },
      // Exam limits
      { key: 'ai_daily_limit.student.generate_exam', value: 3, description: 'Số lần gen đề thi / ngày cho SV' },
      { key: 'ai_daily_limit.lecturer.generate_exam', value: 10, description: 'Số lần gen đề thi / ngày cho GV' },
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
      console.log('Admin user created: admin@educhat.local / Admin@123456');
    }

    await qr.commitTransaction();
    console.log('Seed completed successfully');
  } catch (error) {
    await qr.rollbackTransaction();
    console.error('Seed failed:', error);
    throw error;
  } finally {
    await qr.release();
    await dataSource.destroy();
  }
}

seed().catch(console.error);
