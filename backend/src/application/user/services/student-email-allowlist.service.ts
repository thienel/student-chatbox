import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { StudentEmailAllowlistOrmEntity, EmailAllowlistStatus } from '../../../infrastructure/database/typeorm/orm-entities/student-email-allowlist.orm-entity';
import { CreateStudentEmailAllowlistDto } from '../dtos/student-email-allowlist.dto';

@Injectable()
export class StudentEmailAllowlistService {
  constructor(
    @InjectRepository(StudentEmailAllowlistOrmEntity)
    private readonly allowlistRepo: Repository<StudentEmailAllowlistOrmEntity>,
  ) {}

  async findAvailableByEmailAndStudentCode(email: string, studentCode: string): Promise<StudentEmailAllowlistOrmEntity | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = studentCode.trim().toUpperCase();

    return this.allowlistRepo.findOne({
      where: { email: normalizedEmail, studentCode: normalizedCode },
    });
  }

  async validateAllowlistRecord(email: string, studentCode: string): Promise<StudentEmailAllowlistOrmEntity> {
    const record = await this.findAvailableByEmailAndStudentCode(email, studentCode);

    if (!record) {
      throw new BadRequestException({
        message: 'Không tìm thấy dữ liệu xác minh cho email và mã sinh viên này.',
        code: 'ALLOWLIST_RECORD_NOT_FOUND',
      });
    }

    if (record.status !== EmailAllowlistStatus.AVAILABLE) {
      if (record.status === EmailAllowlistStatus.CLAIMED) {
        throw new BadRequestException({
          message: 'Email này đã được sử dụng để xác minh một tài khoản sinh viên.',
          code: 'ALLOWLIST_EMAIL_ALREADY_CLAIMED',
        });
      }
      if (record.status === EmailAllowlistStatus.EXPIRED) {
        throw new BadRequestException({
          message: 'Email cá nhân này đã hết hạn xác minh. Vui lòng gửi yêu cầu xác minh thủ công.',
          code: 'ALLOWLIST_RECORD_EXPIRED',
        });
      }
      throw new BadRequestException({
        message: 'Email cá nhân này không khả dụng.',
        code: 'ALLOWLIST_RECORD_DISABLED',
      });
    }

    if (record.expiresAt && record.expiresAt < new Date()) {
      throw new BadRequestException({
        message: 'Email cá nhân này đã hết hạn xác minh. Vui lòng gửi yêu cầu xác minh thủ công.',
        code: 'ALLOWLIST_RECORD_EXPIRED',
      });
    }

    if (record.claimedByUserId) {
      throw new BadRequestException({
        message: 'Email này đã được sử dụng để xác minh một tài khoản sinh viên.',
        code: 'ALLOWLIST_EMAIL_ALREADY_CLAIMED',
      });
    }

    return record;
  }

  async claimAllowlistRecord(allowlistId: string, userId: string, manager: EntityManager): Promise<void> {
    const allowlist = await manager.findOne(StudentEmailAllowlistOrmEntity, {
      where: { id: allowlistId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!allowlist) {
      throw new BadRequestException({
        message: 'Không tìm thấy dữ liệu xác minh email cá nhân.',
        code: 'ALLOWLIST_RECORD_NOT_FOUND',
      });
    }

    if (allowlist.status !== EmailAllowlistStatus.AVAILABLE) {
      throw new BadRequestException({
        message: 'Email cá nhân này không còn khả dụng để xác minh.',
        code: 'ALLOWLIST_RECORD_NOT_AVAILABLE',
      });
    }

    allowlist.status = EmailAllowlistStatus.CLAIMED;
    allowlist.claimedByUserId = userId;
    allowlist.claimedAt = new Date();

    await manager.save(allowlist);
  }

  async createAllowlistRecord(dto: CreateStudentEmailAllowlistDto, adminId: string): Promise<StudentEmailAllowlistOrmEntity> {
    const existing = await this.findAvailableByEmailAndStudentCode(dto.email, dto.studentCode);
    if (existing) {
      throw new BadRequestException({
        message: 'Record với email và student code này đã tồn tại',
        code: 'ALLOWLIST_RECORD_EXISTS',
      });
    }

    const record = this.allowlistRepo.create({
      email: dto.email,
      studentCode: dto.studentCode,
      fullName: dto.fullName,
      campus: dto.campus,
      expiresAt: dto.expiresAt,
      createdBy: adminId,
    });

    return this.allowlistRepo.save(record);
  }

  async bulkImportAllowlist(records: CreateStudentEmailAllowlistDto[], adminId: string) {
    let inserted = 0;
    let skipped = 0;

    for (const dto of records) {
      try {
        const existing = await this.findAvailableByEmailAndStudentCode(dto.email, dto.studentCode);
        if (existing) {
          skipped++;
          continue;
        }

        const record = this.allowlistRepo.create({
          email: dto.email,
          studentCode: dto.studentCode,
          fullName: dto.fullName,
          campus: dto.campus,
          expiresAt: dto.expiresAt,
          createdBy: adminId,
        });

        await this.allowlistRepo.save(record);
        inserted++;
      } catch (err) {
        skipped++;
      }
    }

    return { total: records.length, inserted, skipped };
  }

  async disableAllowlistRecord(id: string): Promise<void> {
    await this.allowlistRepo.update(id, { status: EmailAllowlistStatus.DISABLED });
  }

  async enableAllowlistRecord(id: string): Promise<void> {
    const record = await this.allowlistRepo.findOne({ where: { id } });
    if (!record) throw new BadRequestException('Not found');
    if (record.status === EmailAllowlistStatus.CLAIMED) {
      throw new BadRequestException('Cannot enable claimed record');
    }
    await this.allowlistRepo.update(id, { status: EmailAllowlistStatus.AVAILABLE });
  }

  async getAllowlistRecords(query: any) {
    const qb = this.allowlistRepo.createQueryBuilder('a');
    
    if (query.status) {
      qb.andWhere('a.status = :status', { status: query.status });
    }
    if (query.campus) {
      qb.andWhere('a.campus = :campus', { campus: query.campus });
    }
    if (query.search) {
      qb.andWhere('(a.email ILIKE :search OR a.student_code ILIKE :search OR a.full_name ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('a.createdAt', 'DESC')
      .getManyAndCount();

    return { items, total };
  }
}
