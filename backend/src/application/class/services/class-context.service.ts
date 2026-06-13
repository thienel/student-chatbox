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
