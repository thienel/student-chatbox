import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ISubjectRepository, ListSubjectsFilter } from '../../../../domain/subject/repositories/subject.repository.interface';
import { Subject, SubjectStatus } from '../../../../domain/subject/entities/subject.entity';
import { SubjectOrmEntity } from '../orm-entities/subject.orm-entity';

@Injectable()
export class SubjectTypeOrmRepository implements ISubjectRepository {
  constructor(
    @InjectRepository(SubjectOrmEntity)
    private readonly repo: Repository<SubjectOrmEntity>,
    private readonly dataSource: DataSource,
  ) {}

  private toEntity(orm: SubjectOrmEntity): Subject {
    const subject = new Subject();
    subject.id = orm.id;
    subject.code = orm.code;
    subject.name = orm.name;
    subject.description = orm.description;
    subject.status = orm.status as SubjectStatus;
    subject.createdBy = orm.createdBy;
    subject.createdAt = orm.createdAt;
    subject.updatedAt = orm.updatedAt;
    if (orm.lecturers) {
      subject.lecturers = orm.lecturers.map((l) => ({
        id: l.id,
        fullName: l.fullName,
        email: l.email,
      }));
    }
    return subject;
  }

  async findById(id: string): Promise<Subject | null> {
    const orm = await this.repo.findOne({
      where: { id },
      relations: ['lecturers'],
    });
    return orm ? this.toEntity(orm) : null;
  }

  async findByCode(code: string): Promise<Subject | null> {
    const orm = await this.repo.findOne({ where: { code } });
    return orm ? this.toEntity(orm) : null;
  }

  async findAll(filter: ListSubjectsFilter): Promise<{ items: Subject[]; total: number }> {
    const qb = this.repo.createQueryBuilder('s')
      .leftJoinAndSelect('s.lecturers', 'lecturer');

    if (filter.status) {
      qb.andWhere('s.status = :status', { status: filter.status });
    }
    if (filter.search) {
      qb.andWhere('(s.name ILIKE :search OR s.code ILIKE :search)', {
        search: `%${filter.search}%`,
      });
    }
    if (filter.lecturerId) {
      qb.andWhere('lecturer.id = :lecturerId', { lecturerId: filter.lecturerId });
    }
    // Students browse all (active) subjects to discover and enroll; the
    // enrollment state is surfaced per-subject via isEnrolled below.

    const total = await qb.getCount();
    const items = await qb
      .skip((filter.page - 1) * filter.limit)
      .take(filter.limit)
      .getMany();

    let enrolledIds = new Set<string>();
    if (filter.studentId && items.length > 0) {
      const rows = await this.dataSource.query(
        `SELECT DISTINCT c.subject_id FROM class_enrollments ce
         JOIN classes c ON c.id = ce.class_id
         WHERE ce.student_id = $1 AND c.subject_id = ANY($2)`,
        [filter.studentId, items.map((i) => i.id)],
      );
      enrolledIds = new Set(rows.map((r: { subject_id: string }) => r.subject_id));
    }

    return {
      items: items.map((o) => {
        const subject = this.toEntity(o);
        if (filter.studentId) subject.isEnrolled = enrolledIds.has(o.id);
        return subject;
      }),
      total,
    };
  }

  async create(data: Partial<Subject>): Promise<Subject> {
    const orm = this.repo.create({
      code: data.code,
      name: data.name,
      description: data.description,
      status: data.status ?? SubjectStatus.ACTIVE,
      createdBy: data.createdBy,
    });
    const saved = await this.repo.save(orm);
    return this.toEntity(saved);
  }

  async update(id: string, data: Partial<Subject>): Promise<Subject> {
    const updateData: Partial<SubjectOrmEntity> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    await this.repo.update(id, updateData);
    return this.findById(id) as Promise<Subject>;
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async assignLecturer(subjectId: string, lecturerId: string, _assignedBy: string): Promise<void> {
    await this.dataSource.query(
      `INSERT INTO subject_lecturers (subject_id, lecturer_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [subjectId, lecturerId],
    );
  }

  async removeLecturer(subjectId: string, lecturerId: string): Promise<void> {
    await this.dataSource.query(
      `DELETE FROM subject_lecturers WHERE subject_id = $1 AND lecturer_id = $2`,
      [subjectId, lecturerId],
    );
  }

  async isLecturerAssigned(subjectId: string, lecturerId: string): Promise<boolean> {
    const result = await this.dataSource.query(
      `SELECT 1 FROM subject_lecturers WHERE subject_id = $1 AND lecturer_id = $2`,
      [subjectId, lecturerId],
    );
    return result.length > 0;
  }

  async enrollStudent(subjectId: string, studentId: string): Promise<void> {
    await this.dataSource.query(
      `INSERT INTO subject_enrollments (subject_id, student_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [subjectId, studentId],
    );
  }

  async unenrollStudent(subjectId: string, studentId: string): Promise<void> {
    await this.dataSource.query(
      `DELETE FROM subject_enrollments WHERE subject_id = $1 AND student_id = $2`,
      [subjectId, studentId],
    );
  }

  async isStudentEnrolled(subjectId: string, studentId: string): Promise<boolean> {
    const result = await this.dataSource.query(
      `SELECT 1 FROM subject_enrollments WHERE subject_id = $1 AND student_id = $2`,
      [subjectId, studentId],
    );
    return result.length > 0;
  }
}
