import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  IClassRepository,
  ISubjectLecturer,
  IClassStudent,
  IClassStats,
  IStudentEngagement,
  IStudentExamAttempt,
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

  async getClassStats(classId: string): Promise<IClassStats> {
    const [overviewRow] = await this.dataSource.query(
      `SELECT
         (SELECT COUNT(*) FROM class_enrollments WHERE class_id = $1)::int AS "studentCount",
         (SELECT COUNT(*) FROM documents d JOIN classes c ON c.id = $1
            WHERE d.subject_id = c.subject_id AND d.uploaded_by = c.lecturer_id)::int AS "documentCount",
         (SELECT COUNT(*) FROM documents d JOIN classes c ON c.id = $1
            WHERE d.subject_id = c.subject_id AND d.uploaded_by = c.lecturer_id AND d.status = 'ready')::int AS "documentsReady",
         (SELECT COUNT(*) FROM exams WHERE class_id = $1)::int AS "examCount",
         (SELECT COUNT(*) FROM flashcard_sets WHERE class_id = $1)::int AS "flashcardSetCount",
         (SELECT COUNT(*) FROM exam_attempts ea JOIN exams e ON e.id = ea.exam_id
            WHERE e.class_id = $1 AND ea.status = 'completed')::int AS "totalAttempts",
         (SELECT AVG(ea.score) FROM exam_attempts ea JOIN exams e ON e.id = ea.exam_id
            WHERE e.class_id = $1 AND ea.status = 'completed') AS "avgScore"`,
      [classId],
    );

    const students = await this.dataSource.query(
      `SELECT u.id, u.full_name AS "fullName", u.email,
         COUNT(ea.id) FILTER (WHERE ea.status = 'completed')::int AS "examAttempts",
         AVG(ea.score) FILTER (WHERE ea.status = 'completed') AS "avgScore",
         MAX(COALESCE(ea.completed_at, ea.started_at)) AS "lastActiveAt"
       FROM class_enrollments ce
       JOIN users u ON u.id = ce.student_id
       LEFT JOIN exams e ON e.class_id = ce.class_id AND e.created_by = u.id
       LEFT JOIN exam_attempts ea ON ea.exam_id = e.id AND ea.user_id = u.id
       WHERE ce.class_id = $1
       GROUP BY u.id, u.full_name, u.email
       ORDER BY u.full_name ASC`,
      [classId],
    );

    return {
      overview: {
        studentCount: overviewRow.studentCount,
        documentCount: overviewRow.documentCount,
        documentsReady: overviewRow.documentsReady,
        examCount: overviewRow.examCount,
        flashcardSetCount: overviewRow.flashcardSetCount,
        totalAttempts: overviewRow.totalAttempts,
        avgScore: overviewRow.avgScore === null ? null : Number(overviewRow.avgScore),
      },
      students: students.map((s: IClassStats['students'][number]) => ({
        ...s,
        avgScore: s.avgScore === null ? null : Number(s.avgScore),
      })),
    };
  }

  async getClassEngagement(subjectId: string, classId: string): Promise<IStudentEngagement[]> {
    const rows = await this.dataSource.query(
      `SELECT u.id AS "userId", u.full_name AS "fullName", u.email,
         ce.enrolled_at AS "enrolledAt",
         COALESCE(st.current_streak, 0) AS "currentStreak",
         COALESCE(st.total_sessions, 0) AS "totalStudySessions",
         COALESCE(st.total_cards_reviewed, 0) AS "totalCardsReviewed",
         (SELECT COALESCE(SUM(star_count), 0)::int FROM flashcard_sets fs
            WHERE fs.created_by = u.id AND fs.is_public) AS "totalStarsReceived",
         (SELECT COUNT(*)::int FROM board_questions bq
            WHERE bq.author_id = u.id AND bq.class_id = ce.class_id) AS "questionsPosted",
         (SELECT COUNT(*)::int FROM board_answers ba
            JOIN board_questions bq2 ON bq2.id = ba.question_id
            WHERE ba.author_id = u.id AND bq2.class_id = ce.class_id) AS "answersPosted",
         (SELECT COUNT(*)::int FROM exam_attempts ea JOIN exams e ON e.id = ea.exam_id
            WHERE ea.user_id = u.id AND e.subject_id = $1 AND ea.status = 'completed') AS "examAttemptCount",
         (SELECT AVG(ea.score) FROM exam_attempts ea JOIN exams e ON e.id = ea.exam_id
            WHERE ea.user_id = u.id AND e.subject_id = $1 AND ea.status = 'completed') AS "avgExamScore",
         GREATEST(
           (SELECT MAX(s.completed_at) FROM flashcard_study_sessions s WHERE s.user_id = u.id),
           (SELECT MAX(COALESCE(ea.completed_at, ea.started_at)) FROM exam_attempts ea WHERE ea.user_id = u.id),
           (SELECT MAX(bq.created_at) FROM board_questions bq WHERE bq.author_id = u.id),
           (SELECT MAX(ba.created_at) FROM board_answers ba WHERE ba.author_id = u.id)
         ) AS "lastActiveAt"
       FROM class_enrollments ce
       JOIN users u ON u.id = ce.student_id
       LEFT JOIN student_study_stats st ON st.user_id = u.id
       WHERE ce.class_id = $2
       ORDER BY u.full_name ASC`,
      [subjectId, classId],
    );

    return rows.map((r: Record<string, unknown>) => ({
      userId: r.userId as string,
      fullName: r.fullName as string,
      email: r.email as string,
      enrolledAt: r.enrolledAt as Date,
      stats: {
        lastActiveAt: (r.lastActiveAt as Date) ?? null,
        currentStreak: Number(r.currentStreak),
        totalStudySessions: Number(r.totalStudySessions),
        totalCardsReviewed: Number(r.totalCardsReviewed),
        totalStarsReceived: Number(r.totalStarsReceived),
        questionsPosted: Number(r.questionsPosted),
        answersPosted: Number(r.answersPosted),
        examAttemptCount: Number(r.examAttemptCount),
        avgExamScore: r.avgExamScore === null ? null : Number(r.avgExamScore),
      },
    }));
  }

  async getStudentExamAttempts(subjectId: string, studentId: string): Promise<IStudentExamAttempt[]> {
    const rows = await this.dataSource.query(
      `SELECT e.id AS "examId", e.title AS "examTitle", ea.score AS "score",
         COALESCE(ea.completed_at, ea.started_at) AS "attemptedAt"
       FROM exam_attempts ea
       JOIN exams e ON e.id = ea.exam_id
       WHERE ea.user_id = $1 AND e.subject_id = $2 AND ea.status = 'completed'
       ORDER BY COALESCE(ea.completed_at, ea.started_at) DESC`,
      [studentId, subjectId],
    );
    return rows.map((r: Record<string, unknown>) => ({
      examId: r.examId as string,
      examTitle: r.examTitle as string,
      score: r.score === null ? null : Number(r.score),
      attemptedAt: r.attemptedAt as Date,
    }));
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
