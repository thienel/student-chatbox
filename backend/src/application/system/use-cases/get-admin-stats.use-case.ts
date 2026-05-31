import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserOrmEntity } from '../../../infrastructure/database/typeorm/orm-entities/user.orm-entity';
import { SubjectOrmEntity } from '../../../infrastructure/database/typeorm/orm-entities/subject.orm-entity';
import { DocumentOrmEntity } from '../../../infrastructure/database/typeorm/orm-entities/document.orm-entity';

export interface AdminStats {
  totalUsers: number;
  usersByRole: { admin: number; lecturer: number; student: number };
  totalSubjects: number;
  totalDocuments: number;
}

@Injectable()
export class GetAdminStatsUseCase {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly userRepo: Repository<UserOrmEntity>,
    @InjectRepository(SubjectOrmEntity)
    private readonly subjectRepo: Repository<SubjectOrmEntity>,
    @InjectRepository(DocumentOrmEntity)
    private readonly documentRepo: Repository<DocumentOrmEntity>,
  ) {}

  async execute(): Promise<AdminStats> {
    const [totalUsers, totalSubjects, totalDocuments] = await Promise.all([
      this.userRepo.count(),
      this.subjectRepo.count(),
      this.documentRepo.count(),
    ]);

    const rows: { roleName: string; count: string }[] = await this.userRepo
      .createQueryBuilder('u')
      .leftJoin('u.role', 'r')
      .select('r.name', 'roleName')
      .addSelect('COUNT(*)', 'count')
      .groupBy('r.name')
      .getRawMany();

    const usersByRole = { admin: 0, lecturer: 0, student: 0 };
    for (const row of rows) {
      if (row.roleName in usersByRole) {
        usersByRole[row.roleName as keyof typeof usersByRole] = Number(row.count);
      }
    }

    return { totalUsers, usersByRole, totalSubjects, totalDocuments };
  }
}
