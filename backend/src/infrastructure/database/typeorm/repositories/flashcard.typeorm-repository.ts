import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IFlashcardRepository } from '../../../../domain/flashcard/repositories/flashcard.repository.interface';
import { FlashcardSet } from '../../../../domain/flashcard/entities/flashcard-set.entity';
import { Flashcard } from '../../../../domain/flashcard/entities/flashcard.entity';
import { FlashcardSetOrmEntity } from '../orm-entities/flashcard-set.orm-entity';
import { FlashcardOrmEntity } from '../orm-entities/flashcard.orm-entity';

@Injectable()
export class FlashcardTypeOrmRepository implements IFlashcardRepository {
  constructor(
    @InjectRepository(FlashcardSetOrmEntity)
    private readonly setRepo: Repository<FlashcardSetOrmEntity>,
    @InjectRepository(FlashcardOrmEntity)
    private readonly cardRepo: Repository<FlashcardOrmEntity>,
  ) {}

  private toSetEntity(orm: FlashcardSetOrmEntity): FlashcardSet {
    const s = new FlashcardSet();
    s.id = orm.id;
    s.subjectId = orm.subjectId;
    s.classId = orm.classId;
    s.title = orm.title;
    s.description = orm.description ?? undefined;
    s.isPublic = orm.isPublic;
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
      isPublic: data.isPublic ?? true,
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
}
