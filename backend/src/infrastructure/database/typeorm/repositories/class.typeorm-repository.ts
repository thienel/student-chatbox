import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  IClassRepository,
  ISubjectLecturer,
  IClassStudent,
} from '../../../../domain/class/repositories/class.repository.interface';
import { Class } from '../../../../domain/class/entities/class.entity';
import { ClassOrmEntity } from '../orm-entities/class.orm-entity';

@Injectable()
export class ClassTypeOrmRepository implements IClassRepository {
  constructor(
    @InjectRepository(ClassOrmEntity)
    private readonly repo: Repository<ClassOrmEntity>,
    private readonly dataSource: DataSource,
  ) {}

  private toEntity(orm: ClassOrmEntity, studentCount?: number): Class {
    const c = new Class();
    c.id = orm.id;
    c.subjectId = orm.subjectId;
    c.lecturerId = orm.lecturerId;
    c.name = orm.name;
    c.passwordHash = orm.passwordHash;
    c.createdAt = orm.createdAt;
    c.updatedAt = orm.updatedAt;
    if (orm.lecturer) {
      c.lecturer = { id: orm.lecturer.id, fullName: orm.lecturer.fullName };
    }
    if (studentCount !== undefined) c.studentCount = studentCount;
    return c;
  }

  async create(data: {
    subjectId: string;
    lecturerId: string;
    name: string;
    passwordHash: string;
  }): Promise<Class> {
    const orm = this.repo.create(data);
    const saved = await this.repo.save(orm);
    return this.toEntity(saved);
  }

  async findById(id: string): Promise<Class | null> {
    const orm = await this.repo.findOne({ where: { id }, relations: ['lecturer'] });
    return orm ? this.toEntity(orm) : null;
  }

  async listBySubject(subjectId: string): Promise<Class[]> {
    const orms = await this.repo.find({
      where: { subjectId },
      relations: ['lecturer'],
      order: { createdAt: 'ASC' },
    });
    if (orms.length === 0) return [];
    const counts = await this.dataSource.query(
      `SELECT class_id, COUNT(*)::int AS count FROM class_enrollments WHERE class_id = ANY($1) GROUP BY class_id`,
      [orms.map((o) => o.id)],
    );
    const countMap = new Map<string, number>(
      counts.map((r: { class_id: string; count: number }) => [r.class_id, r.count]),
    );
    return orms.map((o) => this.toEntity(o, countMap.get(o.id) ?? 0));
  }

  async listBySubjectAndLecturer(subjectId: string, lecturerId: string): Promise<Class[]> {
    const orms = await this.repo.find({ where: { subjectId, lecturerId } });
    return orms.map((o) => this.toEntity(o));
  }

  async listLecturersWithClasses(subjectId: string): Promise<ISubjectLecturer[]> {
    const rows = await this.dataSource.query(
      `SELECT DISTINCT u.id, u.full_name AS "fullName"
       FROM classes c JOIN users u ON u.id = c.lecturer_id
       WHERE c.subject_id = $1
       ORDER BY u.full_name ASC`,
      [subjectId],
    );
    return rows as ISubjectLecturer[];
  }

  async enrollStudent(classId: string, studentId: string): Promise<void> {
    await this.dataSource.query(
      `INSERT INTO class_enrollments (class_id, student_id) VALUES ($1, $2)
       ON CONFLICT (class_id, student_id) DO NOTHING`,
      [classId, studentId],
    );
  }

  async listStudents(classId: string): Promise<IClassStudent[]> {
    const rows = await this.dataSource.query(
      `SELECT u.id, u.full_name AS "fullName", u.email, ce.enrolled_at AS "enrolledAt"
       FROM class_enrollments ce JOIN users u ON u.id = ce.student_id
       WHERE ce.class_id = $1
       ORDER BY u.full_name ASC`,
      [classId],
    );
    return rows as IClassStudent[];
  }

  async removeStudent(classId: string, studentId: string): Promise<void> {
    await this.dataSource.query(
      `DELETE FROM class_enrollments WHERE class_id = $1 AND student_id = $2`,
      [classId, studentId],
    );
  }

  async unenrollStudentFromSubject(subjectId: string, studentId: string): Promise<void> {
    await this.dataSource.query(
      `DELETE FROM class_enrollments ce
       USING classes c
       WHERE ce.class_id = c.id AND c.subject_id = $1 AND ce.student_id = $2`,
      [subjectId, studentId],
    );
  }

  async findStudentClassInSubject(subjectId: string, studentId: string): Promise<Class | null> {
    const orm = await this.repo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.lecturer', 'lecturer')
      .innerJoin('class_enrollments', 'ce', 'ce.class_id = c.id AND ce.student_id = :studentId', {
        studentId,
      })
      .where('c.subject_id = :subjectId', { subjectId })
      .getOne();
    return orm ? this.toEntity(orm) : null;
  }
}
