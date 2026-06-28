import {
  Injectable,
  Inject,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { IClassRepository } from '../../../domain/class/repositories/class.repository.interface';
import { TOKENS } from '../../../shared/constants/tokens';
import { User } from '../../../domain/user/entities/user.entity';

/**
 * Resolves which class a content operation targets, enforcing membership:
 * - students operate inside the single class they enrolled in (403 if none);
 * - lecturers/admins must name a class explicitly and may only touch classes
 *   they own (admins: any class) within the subject.
 */
@Injectable()
export class ClassContextService {
  constructor(
    @Inject(TOKENS.CLASS_REPO) private readonly classRepo: IClassRepository,
  ) {}

  async resolveClassId(subjectId: string, user: User, explicitClassId?: string): Promise<string> {
    if (user.roleName === 'student') {
      const cls = await this.classRepo.findStudentClassInSubject(subjectId, user.id);
      if (!cls) {
        throw new ForbiddenException('You are not enrolled in any class for this subject');
      }
      return cls.id;
    }

    if (!explicitClassId) {
      throw new BadRequestException('classId is required');
    }
    const cls = await this.classRepo.findById(explicitClassId);
    if (!cls || cls.subjectId !== subjectId) {
      throw new NotFoundException('Class not found in this subject');
    }
    if (user.roleName === 'lecturer' && cls.lecturerId !== user.id) {
      throw new ForbiddenException('You do not own this class');
    }
    return explicitClassId;
  }

  /**
   * Resolve which lecturer's knowledge base (lecturer+subject) a content
   * operation targets:
   * - lecturers own their knowledge base (their own id);
   * - students use the knowledge base of the lecturer who teaches their class;
   * - admins must name a class explicitly (its lecturer's knowledge base).
   */
  async resolveLecturerId(subjectId: string, user: User, explicitClassId?: string): Promise<string> {
    if (user.roleName === 'lecturer') {
      return user.id;
    }
    if (user.roleName === 'student') {
      const cls = await this.classRepo.findStudentClassInSubject(subjectId, user.id);
      if (!cls) {
        throw new ForbiddenException('You are not enrolled in any class for this subject');
      }
      return cls.lecturerId;
    }
    if (!explicitClassId) {
      throw new BadRequestException('classId is required');
    }
    const cls = await this.classRepo.findById(explicitClassId);
    if (!cls || cls.subjectId !== subjectId) {
      throw new NotFoundException('Class not found in this subject');
    }
    return cls.lecturerId;
  }

  /** The lecturer who teaches a class — used to scope an existing chat/set to its knowledge base. */
  async getLecturerIdForClass(classId: string): Promise<string> {
    const cls = await this.classRepo.findById(classId);
    if (!cls) {
      throw new NotFoundException('Class not found');
    }
    return cls.lecturerId;
  }

  /**
   * Guard access to an existing piece of content that already carries a classId:
   * students must belong to that class, lecturers must own it, admins pass.
   */
  async assertAccess(subjectId: string, user: User, contentClassId?: string): Promise<void> {
    if (!contentClassId) {
      throw new ForbiddenException('Content is not bound to a class');
    }
    if (user.roleName === 'admin') return;

    if (user.roleName === 'student') {
      const cls = await this.classRepo.findStudentClassInSubject(subjectId, user.id);
      if (!cls || cls.id !== contentClassId) {
        throw new ForbiddenException('You do not have access to this content');
      }
      return;
    }

    const cls = await this.classRepo.findById(contentClassId);
    if (!cls || cls.subjectId !== subjectId || cls.lecturerId !== user.id) {
      throw new ForbiddenException('You do not have access to this content');
    }
  }
}
