import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  IFlashcardRepository,
  DiscoverSetsQuery,
  DiscoverSetsResult,
  LeaderboardResult,
} from '../../../../domain/flashcard/repositories/flashcard.repository.interface';
import { FlashcardSet } from '../../../../domain/flashcard/entities/flashcard-set.entity';
import { Flashcard } from '../../../../domain/flashcard/entities/flashcard.entity';
import { FlashcardSetOrmEntity } from '../orm-entities/flashcard-set.orm-entity';
import { FlashcardSetStarOrmEntity } from '../orm-entities/flashcard-set-star.orm-entity';
import { FlashcardOrmEntity } from '../orm-entities/flashcard.orm-entity';

@Injectable()
export class FlashcardTypeOrmRepository implements IFlashcardRepository {
  constructor(
    @InjectRepository(FlashcardSetOrmEntity)
    private readonly setRepo: Repository<FlashcardSetOrmEntity>,
    @InjectRepository(FlashcardOrmEntity)
    private readonly cardRepo: Repository<FlashcardOrmEntity>,
    @InjectRepository(FlashcardSetStarOrmEntity)
    private readonly starRepo: Repository<FlashcardSetStarOrmEntity>,
    private readonly dataSource: DataSource,
  ) {}

  private toSetEntity(orm: FlashcardSetOrmEntity): FlashcardSet {
    const s = new FlashcardSet();
    s.id = orm.id;
    s.subjectId = orm.subjectId;
    s.classId = orm.classId;
    s.title = orm.title;
    s.description = orm.description ?? undefined;
    s.isPublic = orm.isPublic;
    s.starCount = orm.starCount;
    s.clonedFromId = orm.clonedFromId ?? undefined;
    s.publishedAt = orm.publishedAt ?? undefined;
    s.createdBy = orm.createdBy;
    s.createdAt = orm.createdAt;
    s.updatedAt = orm.updatedAt;
    return s;
  }

  private toCardEntity(orm: FlashcardOrmEntity): Flashcard {
    const c = new Flashcard();
    c.id = orm.id;
    c.setId = orm.setId;
    c.front = orm.front;
    c.back = orm.back;
    c.position = orm.position;
    c.createdAt = orm.createdAt;
    return c;
  }

  async createSet(data: Partial<FlashcardSet>): Promise<FlashcardSet> {
    const orm = this.setRepo.create({
      subjectId: data.subjectId,
      classId: data.classId,
      title: data.title,
      description: data.description ?? null,
      isPublic: data.isPublic ?? false,
      clonedFromId: data.clonedFromId ?? null,
      createdBy: data.createdBy,
    });
    const saved = await this.setRepo.save(orm);
    return this.toSetEntity(saved);
  }

  async findSetById(id: string): Promise<FlashcardSet | null> {
    const orm = await this.setRepo.findOne({ where: { id } });
    return orm ? this.toSetEntity(orm) : null;
  }

  async findSetsBySubjectId(subjectId: string): Promise<FlashcardSet[]> {
    const orms = await this.setRepo.find({
      where: { subjectId },
      order: { createdAt: 'DESC' },
    });
    return orms.map((o) => this.toSetEntity(o));
  }

  async findSetsByClassId(classId: string): Promise<FlashcardSet[]> {
    const orms = await this.setRepo.find({
      where: { classId },
      order: { createdAt: 'DESC' },
    });
    return orms.map((o) => this.toSetEntity(o));
  }

  async deleteSet(id: string): Promise<void> {
    await this.setRepo.delete(id);
  }

  async createCards(
    cards: Array<{ setId: string; front: string; back: string; position: number }>,
  ): Promise<Flashcard[]> {
    const orms = this.cardRepo.create(cards);
    const saved = await this.cardRepo.save(orms);
    return saved.map((o) => this.toCardEntity(o));
  }

  async findCardsBySetId(setId: string): Promise<Flashcard[]> {
    const orms = await this.cardRepo.find({
      where: { setId },
      order: { position: 'ASC' },
    });
    return orms.map((o) => this.toCardEntity(o));
  }

  async countCardsBySetId(setId: string): Promise<number> {
    return this.cardRepo.count({ where: { setId } });
  }

  async setVisibility(setId: string, isPublic: boolean): Promise<FlashcardSet> {
    const set = await this.setRepo.findOneOrFail({ where: { id: setId } });
    set.isPublic = isPublic;
    // Stamp the first time a set is published; keep the original timestamp after.
    if (isPublic && !set.publishedAt) set.publishedAt = new Date();
    const saved = await this.setRepo.save(set);
    return this.toSetEntity(saved);
  }

  async addStar(setId: string, userId: string): Promise<{ added: boolean; starCount: number }> {
    return this.dataSource.transaction(async (m) => {
      const existing = await m.findOne(FlashcardSetStarOrmEntity, { where: { setId, userId } });
      const set = await m.findOneOrFail(FlashcardSetOrmEntity, { where: { id: setId } });
      if (existing) return { added: false, starCount: set.starCount };
      await m.insert(FlashcardSetStarOrmEntity, { setId, userId });
      set.starCount += 1;
      await m.save(set);
      return { added: true, starCount: set.starCount };
    });
  }

  async removeStar(setId: string, userId: string): Promise<{ removed: boolean; starCount: number }> {
    return this.dataSource.transaction(async (m) => {
      const set = await m.findOneOrFail(FlashcardSetOrmEntity, { where: { id: setId } });
      const res = await m.delete(FlashcardSetStarOrmEntity, { setId, userId });
      if (!res.affected) return { removed: false, starCount: set.starCount };
      set.starCount = Math.max(0, set.starCount - 1);
      await m.save(set);
      return { removed: true, starCount: set.starCount };
    });
  }

  async discoverPublicSets(query: DiscoverSetsQuery): Promise<DiscoverSetsResult> {
    const { subjectId, sort, page, pageSize, userId } = query;
    const offset = (page - 1) * pageSize;
    const orderBy = sort === 'newest'
      ? 'fs.published_at DESC NULLS LAST'
      : 'fs.star_count DESC, fs.published_at DESC NULLS LAST';

    const itemParams: unknown[] = [userId];
    let where = 'WHERE fs.is_public = true';
    if (subjectId) {
      itemParams.push(subjectId);
      where += ` AND fs.subject_id = $${itemParams.length}`;
    }

    const items = await this.dataSource.query(
      `SELECT fs.id, fs.title, s.name AS "subjectName", u.full_name AS "creatorName",
         fs.star_count AS "starCount", fs.published_at AS "publishedAt",
         (SELECT COUNT(*)::int FROM flashcards f WHERE f.set_id = fs.id) AS "cardCount",
         EXISTS(SELECT 1 FROM flashcard_set_stars st WHERE st.set_id = fs.id AND st.user_id = $1) AS "isStarredByMe"
       FROM flashcard_sets fs
       JOIN subjects s ON s.id = fs.subject_id
       JOIN users u ON u.id = fs.created_by
       ${where}
       ORDER BY ${orderBy}
       LIMIT ${pageSize} OFFSET ${offset}`,
      itemParams,
    );

    const countWhere = subjectId
      ? 'WHERE fs.is_public = true AND fs.subject_id = $1'
      : 'WHERE fs.is_public = true';
    const [{ total }] = await this.dataSource.query(
      `SELECT COUNT(*)::int AS total FROM flashcard_sets fs ${countWhere}`,
      subjectId ? [subjectId] : [],
    );

    return { items, total, page, pageSize };
  }

  async getLeaderboard(userId: string, subjectId?: string): Promise<LeaderboardResult> {
    const params: unknown[] = [];
    let subjectFilter = '';
    if (subjectId) {
      params.push(subjectId);
      subjectFilter = `WHERE fs.subject_id = $${params.length}`;
    }

    const ranked = await this.dataSource.query(
      `WITH ranked AS (
         SELECT fs.created_by AS "userId", u.full_name AS "fullName",
           COUNT(*) FILTER (WHERE fs.is_public)::int AS "totalPublicSets",
           COALESCE(SUM(fs.star_count) FILTER (WHERE fs.is_public), 0)::int AS "totalStars",
           MIN(fs.published_at) FILTER (WHERE fs.is_public) AS "firstPublishedAt"
         FROM flashcard_sets fs
         JOIN users u ON u.id = fs.created_by
         ${subjectFilter}
         GROUP BY fs.created_by, u.full_name
         HAVING COUNT(*) FILTER (WHERE fs.is_public) > 0
       )
       SELECT "userId", "fullName", "totalPublicSets", "totalStars",
         ROW_NUMBER() OVER (
           ORDER BY "totalStars" DESC, "totalPublicSets" DESC, "firstPublishedAt" ASC
         )::int AS rank
       FROM ranked`,
      params,
    );

    const items = ranked.slice(0, 50);
    const mine = ranked.find((r: { userId: string }) => r.userId === userId);
    const myRank = mine
      ? { rank: mine.rank, totalStars: mine.totalStars, totalPublicSets: mine.totalPublicSets }
      : null;

    return { scope: subjectId ? 'subject' : 'global', items, myRank };
  }

  async cloneSet(setId: string, userId: string, classId?: string): Promise<{ set: FlashcardSet; cards: Flashcard[] }> {
    const original = await this.setRepo.findOneOrFail({ where: { id: setId } });
    const originalCards = await this.cardRepo.find({ where: { setId }, order: { position: 'ASC' } });

    const newSetOrm = this.setRepo.create({
      subjectId: original.subjectId,
      classId,
      title: `Copy of ${original.title}`,
      description: original.description ?? null,
      isPublic: false,
      clonedFromId: original.id,
      createdBy: userId,
    });
    const newSet = await this.setRepo.save(newSetOrm);

    const clonedCards = this.cardRepo.create(
      originalCards.map((c) => ({
        setId: newSet.id,
        front: c.front,
        back: c.back,
        position: c.position,
      })),
    );
    const savedCards = await this.cardRepo.save(clonedCards);

    return { set: this.toSetEntity(newSet), cards: savedCards.map((o) => this.toCardEntity(o)) };
  }
}
