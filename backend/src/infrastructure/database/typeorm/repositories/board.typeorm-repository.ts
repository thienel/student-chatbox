import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  IBoardRepository, BoardQuestion, BoardAnswer, QuestionListQuery, QuestionListResult, UpvoteTarget,
  BoardQuestionStatus,
} from '../../../../domain/board/board.repository.interface';
import { BoardQuestionOrmEntity } from '../orm-entities/board-question.orm-entity';
import { BoardAnswerOrmEntity } from '../orm-entities/board-answer.orm-entity';
import { BoardUpvoteOrmEntity } from '../orm-entities/board-upvote.orm-entity';

@Injectable()
export class BoardTypeOrmRepository implements IBoardRepository {
  constructor(
    @InjectRepository(BoardQuestionOrmEntity)
    private readonly questionRepo: Repository<BoardQuestionOrmEntity>,
    @InjectRepository(BoardAnswerOrmEntity)
    private readonly answerRepo: Repository<BoardAnswerOrmEntity>,
    private readonly dataSource: DataSource,
  ) {}

  private toQuestion(o: BoardQuestionOrmEntity): BoardQuestion {
    return {
      id: o.id, classId: o.classId, authorId: o.authorId, title: o.title, body: o.body,
      status: o.status, upvoteCount: o.upvoteCount, answerCount: o.answerCount,
      createdAt: o.createdAt, updatedAt: o.updatedAt,
    };
  }

  private toAnswer(o: BoardAnswerOrmEntity): BoardAnswer {
    return {
      id: o.id, questionId: o.questionId, authorId: o.authorId, body: o.body,
      isPinned: o.isPinned, upvoteCount: o.upvoteCount,
      createdAt: o.createdAt, updatedAt: o.updatedAt,
    };
  }

  async createQuestion(classId: string, authorId: string, title: string, body: string): Promise<BoardQuestion> {
    const saved = await this.questionRepo.save(
      this.questionRepo.create({ classId, authorId, title, body, status: 'open' }),
    );
    return this.toQuestion(saved);
  }

  async findQuestionById(id: string): Promise<BoardQuestion | null> {
    const o = await this.questionRepo.findOne({ where: { id } });
    return o ? this.toQuestion(o) : null;
  }

  async listQuestions(query: QuestionListQuery): Promise<QuestionListResult> {
    const { classId, userId, status, sort, page, pageSize } = query;
    const offset = (page - 1) * pageSize;
    const orderBy = sort === 'newest'
      ? 'q.created_at DESC'
      : 'q.upvote_count DESC, q.created_at DESC';

    const params: unknown[] = [userId, classId];
    let where = 'WHERE q.class_id = $2';
    if (status) {
      params.push(status);
      where += ` AND q.status = $${params.length}`;
    }

    const items: BoardQuestion[] = await this.dataSource.query(
      `SELECT q.id, q.class_id AS "classId", q.author_id AS "authorId", q.title, q.body,
         q.status, q.upvote_count AS "upvoteCount", q.answer_count AS "answerCount",
         q.created_at AS "createdAt", q.updated_at AS "updatedAt",
         EXISTS(SELECT 1 FROM board_upvotes u
                WHERE u.user_id = $1 AND u.target_type = 'question' AND u.target_id = q.id) AS "isUpvotedByMe"
       FROM board_questions q
       ${where}
       ORDER BY ${orderBy}
       LIMIT ${pageSize} OFFSET ${offset}`,
      params,
    );

    const countParams: unknown[] = [classId];
    let countWhere = 'WHERE class_id = $1';
    if (status) {
      countParams.push(status);
      countWhere += ` AND status = $2`;
    }
    const [{ total }] = await this.dataSource.query(
      `SELECT COUNT(*)::int AS total FROM board_questions ${countWhere}`,
      countParams,
    );

    return { items, total, page, pageSize };
  }

  async updateQuestion(id: string, data: { title?: string; body?: string }): Promise<BoardQuestion> {
    await this.questionRepo.update(id, {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.body !== undefined ? { body: data.body } : {}),
    });
    const updated = await this.questionRepo.findOneOrFail({ where: { id } });
    return this.toQuestion(updated);
  }

  async deleteQuestion(id: string): Promise<void> {
    await this.questionRepo.delete(id);
  }

  async setQuestionStatus(id: string, status: BoardQuestionStatus): Promise<void> {
    await this.questionRepo.update(id, { status });
  }

  async createAnswer(questionId: string, authorId: string, body: string): Promise<BoardAnswer> {
    return this.dataSource.transaction(async (m) => {
      const saved = await m.save(BoardAnswerOrmEntity, m.create(BoardAnswerOrmEntity, {
        questionId, authorId, body, isPinned: false,
      }));
      await m.increment(BoardQuestionOrmEntity, { id: questionId }, 'answerCount', 1);
      return this.toAnswer(saved);
    });
  }

  async findAnswerById(id: string): Promise<BoardAnswer | null> {
    const o = await this.answerRepo.findOne({ where: { id } });
    return o ? this.toAnswer(o) : null;
  }

  async listAnswers(questionId: string, userId: string): Promise<BoardAnswer[]> {
    return this.dataSource.query(
      `SELECT a.id, a.question_id AS "questionId", a.author_id AS "authorId", a.body,
         a.is_pinned AS "isPinned", a.upvote_count AS "upvoteCount",
         a.created_at AS "createdAt", a.updated_at AS "updatedAt",
         EXISTS(SELECT 1 FROM board_upvotes u
                WHERE u.user_id = $1 AND u.target_type = 'answer' AND u.target_id = a.id) AS "isUpvotedByMe"
       FROM board_answers a
       WHERE a.question_id = $2
       ORDER BY a.is_pinned DESC, a.upvote_count DESC, a.created_at ASC`,
      [userId, questionId],
    );
  }

  async updateAnswer(id: string, body: string): Promise<BoardAnswer> {
    await this.answerRepo.update(id, { body });
    const updated = await this.answerRepo.findOneOrFail({ where: { id } });
    return this.toAnswer(updated);
  }

  async deleteAnswer(id: string): Promise<void> {
    await this.dataSource.transaction(async (m) => {
      const answer = await m.findOne(BoardAnswerOrmEntity, { where: { id } });
      if (!answer) return;
      await m.delete(BoardAnswerOrmEntity, { id });
      await m.decrement(BoardQuestionOrmEntity, { id: answer.questionId }, 'answerCount', 1);
    });
  }

  async togglePin(questionId: string, answerId: string): Promise<{ pinned: boolean }> {
    return this.dataSource.transaction(async (m) => {
      const answer = await m.findOneOrFail(BoardAnswerOrmEntity, { where: { id: answerId } });
      if (answer.isPinned) {
        await m.update(BoardAnswerOrmEntity, { id: answerId }, { isPinned: false });
        // Reopen unless the lecturer explicitly closed it.
        await m.query(
          `UPDATE board_questions SET status = 'open' WHERE id = $1 AND status = 'answered'`,
          [questionId],
        );
        return { pinned: false };
      }
      await m.update(BoardAnswerOrmEntity, { questionId, isPinned: true }, { isPinned: false });
      await m.update(BoardAnswerOrmEntity, { id: answerId }, { isPinned: true });
      await m.query(
        `UPDATE board_questions SET status = 'answered' WHERE id = $1 AND status <> 'closed'`,
        [questionId],
      );
      return { pinned: true };
    });
  }

  async toggleUpvote(
    userId: string, target: UpvoteTarget, targetId: string,
  ): Promise<{ upvoted: boolean; upvoteCount: number }> {
    const targetEntity = target === 'question' ? BoardQuestionOrmEntity : BoardAnswerOrmEntity;
    return this.dataSource.transaction(async (m) => {
      const existing = await m.findOne(BoardUpvoteOrmEntity, {
        where: { userId, targetType: target, targetId },
      });
      if (existing) {
        await m.delete(BoardUpvoteOrmEntity, { id: existing.id });
        await m.decrement(targetEntity, { id: targetId }, 'upvoteCount', 1);
      } else {
        await m.save(BoardUpvoteOrmEntity, m.create(BoardUpvoteOrmEntity, {
          userId, targetType: target, targetId,
        }));
        await m.increment(targetEntity, { id: targetId }, 'upvoteCount', 1);
      }
      const row = await m.findOneOrFail(targetEntity, { where: { id: targetId } });
      return { upvoted: !existing, upvoteCount: row.upvoteCount };
    });
  }
}
