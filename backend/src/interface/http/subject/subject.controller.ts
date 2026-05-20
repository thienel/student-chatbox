import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionGuard } from '../../guards/permission.guard';
import { RequirePermission } from '../../decorators/require-permission.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { CreateSubjectUseCase } from '../../../application/subject/use-cases/create-subject.use-case';
import { ListSubjectsUseCase } from '../../../application/subject/use-cases/list-subjects.use-case';
import { GetSubjectUseCase } from '../../../application/subject/use-cases/get-subject.use-case';
import { UpdateSubjectUseCase } from '../../../application/subject/use-cases/update-subject.use-case';
import { DeleteSubjectUseCase } from '../../../application/subject/use-cases/delete-subject.use-case';
import { AssignLecturerUseCase } from '../../../application/subject/use-cases/assign-lecturer.use-case';
import { RemoveLecturerUseCase } from '../../../application/subject/use-cases/remove-lecturer.use-case';
import { EnrollStudentUseCase } from '../../../application/subject/use-cases/enroll-student.use-case';
import { UnenrollStudentUseCase } from '../../../application/subject/use-cases/unenroll-student.use-case';
import {
  CreateSubjectDto,
  UpdateSubjectDto,
  AssignLecturerDto,
  ListSubjectsDto,
} from '../../../application/subject/dtos/subject.dto';
import { AuditLogService } from '../../../application/system/services/audit-log.service';
import { User } from '../../../domain/user/entities/user.entity';

@Controller('subjects')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class SubjectController {
  constructor(
    private readonly createSubjectUseCase: CreateSubjectUseCase,
    private readonly listSubjectsUseCase: ListSubjectsUseCase,
    private readonly getSubjectUseCase: GetSubjectUseCase,
    private readonly updateSubjectUseCase: UpdateSubjectUseCase,
    private readonly deleteSubjectUseCase: DeleteSubjectUseCase,
    private readonly assignLecturerUseCase: AssignLecturerUseCase,
    private readonly removeLecturerUseCase: RemoveLecturerUseCase,
    private readonly enrollStudentUseCase: EnrollStudentUseCase,
    private readonly unenrollStudentUseCase: UnenrollStudentUseCase,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Post()
  @RequirePermission('subject:create')
  @HttpCode(HttpStatus.CREATED)
  async createSubject(
    @Body() dto: CreateSubjectDto,
    @CurrentUser() user: User,
    @Req() req: Request,
  ) {
    const subject = await this.createSubjectUseCase.execute(dto, user.id);
    await this.auditLogService.log(user.id, 'SUBJECT_CREATED', 'subject', subject.id, { code: dto.code }, req.ip);
    return subject;
  }

  @Get()
  @RequirePermission('subject:read')
  async listSubjects(@Query() dto: ListSubjectsDto, @CurrentUser() user: any) {
    return this.listSubjectsUseCase.execute(dto, user);
  }

  @Get(':id')
  @RequirePermission('subject:read')
  async getSubject(@Param('id') id: string) {
    return this.getSubjectUseCase.execute(id);
  }

  @Patch(':id')
  @RequirePermission('subject:update')
  async updateSubject(@Param('id') id: string, @Body() dto: UpdateSubjectDto) {
    return this.updateSubjectUseCase.execute(id, dto);
  }

  @Delete(':id')
  @RequirePermission('subject:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSubject(@Param('id') id: string) {
    await this.deleteSubjectUseCase.execute(id);
  }

  @Post(':id/lecturers')
  @RequirePermission('subject:assign-lecturer')
  async assignLecturer(
    @Param('id') subjectId: string,
    @Body() dto: AssignLecturerDto,
    @CurrentUser() user: User,
    @Req() req: Request,
  ) {
    await this.assignLecturerUseCase.execute(subjectId, dto.lecturerId, user.id);
    await this.auditLogService.log(user.id, 'LECTURER_ASSIGNED', 'subject', subjectId, { lecturerId: dto.lecturerId }, req.ip);
    return { message: 'Lecturer assigned successfully' };
  }

  @Delete(':id/lecturers/:lecturerId')
  @RequirePermission('subject:assign-lecturer')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeLecturer(
    @Param('id') subjectId: string,
    @Param('lecturerId') lecturerId: string,
  ) {
    await this.removeLecturerUseCase.execute(subjectId, lecturerId);
  }

  @Post(':id/enroll')
  @RequirePermission('subject:enroll')
  @HttpCode(HttpStatus.OK)
  async enrollStudent(@Param('id') subjectId: string, @CurrentUser() user: User) {
    await this.enrollStudentUseCase.execute(subjectId, user.id);
    return { message: 'Enrolled successfully' };
  }

  @Delete(':id/enroll')
  @RequirePermission('subject:enroll')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unenrollStudent(@Param('id') subjectId: string, @CurrentUser() user: User) {
    await this.unenrollStudentUseCase.execute(subjectId, user.id);
  }
}
