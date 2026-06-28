import {
  Injectable, Inject, NotFoundException, ForbiddenException, ConflictException,
} from '@nestjs/common';
import { IBoardRepository } from '../../domain/board/board.repository.interface';
import { TOKENS } from '../../shared/constants/tokens';
import { ClassContextService } from '../class/services/class-context.service';
import { BadgeService } from '../badge/badge.service';
import { User } from '../../domain/user/entities/user.entity';
import { CreateQuestionDto, UpdateQuestionDto, CreateAnswerDto, UpdateAnswerDto } from './dtos/board.dto';

@Injectable()
export class BoardService {
  constructor(
    @Inject(TOKENS.BOARD_REPO) private readonly boardRepo: IBoardRepository,
    private readonly classContext: ClassContextService,
    private readonly badgeService: BadgeService,
  ) {}

  private isModerator(user: User): boolean {
    return user.roleName === 'lecturer' || user.roleName === 'admin';
  }

  /** Membership: students must belong to the class, lecturers must own it, admins pass. */
  private async assertMember(subjectId: string, classId: string, user: User): Promise<void> {
    await this.classContext.assertAccess(subjectId, user, classId);
  }

  private async loadQuestionInClass(classId: string, questionId: string) {
    const question = await this.boardRepo.findQuestionById(questionId);
    if (!question || question.classId !== classId) throw new NotFoundException('Question not found');
    return question;
  }

  async listQuestions(
    subjectId: string, classId: string, user: User,
    opts: { status?: 'open' | 'answered' | 'closed'; sort?: 'upvotes' | 'newest'; page?: number },
  ) {
    await this.assertMember(subjectId, classId, user);
    return this.boardRepo.listQuestions({
      classId,
      userId: user.id,
      status: opts.status,
      sort: opts.sort === 'newest' ? 'newest' : 'upvotes',
      page: opts.page && opts.page > 0 ? opts.page : 1,
      pageSize: 20,
    });
  }

  async createQuestion(subjectId: string, classId: string, user: User, dto: CreateQuestionDto) {
    await this.assertMember(subjectId, classId, user);
    const question = await this.boardRepo.createQuestion(classId, user.id, dto.title, dto.body);
    await this.badgeService.evaluateForUser(user.id);
    return question;
  }

  async updateQuestion(
    subjectId: string, classId: string, questionId: string, user: User, dto: UpdateQuestionDto,
  ) {
    await this.assertMember(subjectId, classId, user);
    const question = await this.loadQuestionInClass(classId, questionId);
    if (question.authorId !== user.id) throw new ForbiddenException('Only the author can edit');
    if (question.answerCount > 0) {
      throw new ConflictException('Cannot edit a question that already has answers');
    }
    return this.boardRepo.updateQuestion(questionId, dto);
  }

  async deleteQuestion(subjectId: string, classId: string, questionId: string, user: User) {
    await this.assertMember(subjectId, classId, user);
    const question = await this.loadQuestionInClass(classId, questionId);
    const isAuthor = question.authorId === user.id;
    if (!this.isModerator(user)) {
      if (!isAuthor) throw new ForbiddenException('You cannot delete this question');
      if (question.answerCount > 0) {
        throw new ConflictException('Cannot delete a question that already has answers');
      }
    }
    await this.boardRepo.deleteQuestion(questionId);
  }

  async closeQuestion(subjectId: string, classId: string, questionId: string, user: User) {
    await this.assertMember(subjectId, classId, user);
    if (!this.isModerator(user)) throw new ForbiddenException('Only a lecturer can close questions');
    await this.loadQuestionInClass(classId, questionId);
    await this.boardRepo.setQuestionStatus(questionId, 'closed');
    return { status: 'closed' };
  }

  async listAnswers(subjectId: string, classId: string, questionId: string, user: User) {
    await this.assertMember(subjectId, classId, user);
    await this.loadQuestionInClass(classId, questionId);
    return this.boardRepo.listAnswers(questionId, user.id);
  }

  async createAnswer(
    subjectId: string, classId: string, questionId: string, user: User, dto: CreateAnswerDto,
  ) {
    await this.assertMember(subjectId, classId, user);
    const question = await this.loadQuestionInClass(classId, questionId);
    if (question.status === 'closed') throw new ConflictException('Question is closed');
    if (question.authorId === user.id) {
      throw new ForbiddenException('You cannot answer your own question');
    }
    const answers = await this.boardRepo.listAnswers(questionId, user.id);
    if (answers.some((a) => a.authorId === user.id)) {
      throw new ConflictException('You have already answered this question');
    }
    return this.boardRepo.createAnswer(questionId, user.id, dto.body);
  }

  async updateAnswer(
    subjectId: string, classId: string, questionId: string, answerId: string, user: User, dto: UpdateAnswerDto,
  ) {
    await this.assertMember(subjectId, classId, user);
    await this.loadQuestionInClass(classId, questionId);
    const answer = await this.boardRepo.findAnswerById(answerId);
    if (!answer || answer.questionId !== questionId) throw new NotFoundException('Answer not found');
    if (answer.authorId !== user.id) throw new ForbiddenException('Only the author can edit');
    if (answer.isPinned) throw new ConflictException('Cannot edit a pinned answer');
    return this.boardRepo.updateAnswer(answerId, dto.body);
  }

  async deleteAnswer(
    subjectId: string, classId: string, questionId: string, answerId: string, user: User,
  ) {
    await this.assertMember(subjectId, classId, user);
    await this.loadQuestionInClass(classId, questionId);
    const answer = await this.boardRepo.findAnswerById(answerId);
    if (!answer || answer.questionId !== questionId) throw new NotFoundException('Answer not found');
    if (!this.isModerator(user)) {
      if (answer.authorId !== user.id) throw new ForbiddenException('You cannot delete this answer');
      if (answer.isPinned) throw new ConflictException('Cannot delete a pinned answer');
    }
    await this.boardRepo.deleteAnswer(answerId);
  }

  async pinAnswer(
    subjectId: string, classId: string, questionId: string, answerId: string, user: User,
  ) {
    await this.assertMember(subjectId, classId, user);
    if (!this.isModerator(user)) throw new ForbiddenException('Only a lecturer can pin answers');
    await this.loadQuestionInClass(classId, questionId);
    const answer = await this.boardRepo.findAnswerById(answerId);
    if (!answer || answer.questionId !== questionId) throw new NotFoundException('Answer not found');

    const result = await this.boardRepo.togglePin(questionId, answerId);
    if (result.pinned) await this.badgeService.evaluateForUser(answer.authorId);
    return result;
  }

  async upvoteQuestion(subjectId: string, classId: string, questionId: string, user: User) {
    await this.assertMember(subjectId, classId, user);
    await this.loadQuestionInClass(classId, questionId);
    return this.boardRepo.toggleUpvote(user.id, 'question', questionId);
  }

  async upvoteAnswer(
    subjectId: string, classId: string, questionId: string, answerId: string, user: User,
  ) {
    await this.assertMember(subjectId, classId, user);
    await this.loadQuestionInClass(classId, questionId);
    const answer = await this.boardRepo.findAnswerById(answerId);
    if (!answer || answer.questionId !== questionId) throw new NotFoundException('Answer not found');
    return this.boardRepo.toggleUpvote(user.id, 'answer', answerId);
  }
}
