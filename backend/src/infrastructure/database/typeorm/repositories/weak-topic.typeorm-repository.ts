import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  IWeakTopicRepository, WeakTopic, WeakTopicWithSubject, SuggestedSet, TopicClassification,
} from '../../../../domain/exam/repositories/weak-topic.repository.interface';

const MIN_QUESTIONS = 5; // below this a topic has insufficient data (BR-F8-07)
const WEAK_MAX = 0.6; // < 60% correct → weak
const STRONG_MIN = 0.8; // >= 80% correct → strong

function classify(rate: number): TopicClassification {
  if (rate < WEAK_MAX) return 'weak';
  if (rate >= STRONG_MIN) return 'strong';
  return 'developing';
}

@Injectable()
export class WeakTopicTypeOrmRepository implements IWeakTopicRepository {
  constructor(private readonly dataSource: DataSource) {}

  async recompute(userId: string, subjectId: string): Promise<void> {
    const rows: Array<{ topic: string; total: number; correct: number }> = await this.dataSource.query(
      `SELECT q.topic AS topic,
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE ea.answers ->> q.id::text = q.correct_answer)::int AS correct
       FROM exam_attempts ea
       JOIN exams e ON e.id = ea.exam_id
       JOIN questions q ON q.exam_id = e.id
       WHERE ea.user_id = $1 AND e.subject_id = $2
         AND ea.status = 'completed' AND q.topic IS NOT NULL
       GROUP BY q.topic`,
      [userId, subjectId],
    );

    const qualifying = rows.filter((r) => r.total >= MIN_QUESTIONS);

    await this.dataSource.transaction(async (m) => {
      // Full recompute: replace the subject's snapshot for this student.
      await m.query(
        `DELETE FROM student_weak_topics WHERE user_id = $1 AND subject_id = $2`,
        [userId, subjectId],
      );
      for (const r of qualifying) {
        const rate = r.correct / r.total;
        await m.query(
          `INSERT INTO student_weak_topics
             (user_id, subject_id, topic, classification, total_questions, correct_count, correct_rate, last_updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, now())`,
          [userId, subjectId, r.topic, classify(rate), r.total, r.correct, rate],
        );
      }
    });
  }

  async findByUserSubject(userId: string, subjectId: string): Promise<WeakTopic[]> {
    return this.dataSource.query(
      `SELECT topic, classification,
         total_questions AS "totalQuestions",
         correct_count AS "correctCount",
         correct_rate AS "correctRate"
       FROM student_weak_topics
       WHERE user_id = $1 AND subject_id = $2
       ORDER BY correct_rate ASC`,
      [userId, subjectId],
    );
  }

  async findAllByUser(userId: string): Promise<WeakTopicWithSubject[]> {
    return this.dataSource.query(
      `SELECT subject_id AS "subjectId", topic, classification,
         total_questions AS "totalQuestions",
         correct_count AS "correctCount",
         correct_rate AS "correctRate"
       FROM student_weak_topics
       WHERE user_id = $1
       ORDER BY correct_rate ASC`,
      [userId],
    );
  }

  async suggestSets(topic: string, limit: number): Promise<SuggestedSet[]> {
    return this.dataSource.query(
      `SELECT id, title, star_count AS "starCount"
       FROM flashcard_sets
       WHERE is_public = true AND title ILIKE $1
       ORDER BY star_count DESC
       LIMIT $2`,
      [`%${topic}%`, limit],
    );
  }
}
