import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionGuard } from '../../guards/permission.guard';
import { RequirePermission } from '../../decorators/require-permission.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { CreateClassUseCase } from '../../../application/class/use-cases/create-class.use-case';
import { ListSubjectClassesUseCase } from '../../../application/class/use-cases/list-subject-classes.use-case';
import { ListSubjectLecturersUseCase } from '../../../application/class/use-cases/list-subject-lecturers.use-case';
import { EnrollByPasswordUseCase } from '../../../application/class/use-cases/enroll-by-password.use-case';
import { UnenrollClassUseCase } from '../../../application/class/use-cases/unenroll-class.use-case';
import { GetMyClassUseCase } from '../../../application/class/use-cases/get-my-class.use-case';
import { CreateClassDto, EnrollByPasswordDto } from '../../../application/class/dtos/class.dto';
import { User } from '../../../domain/user/entities/user.entity';

@Controller('subjects/:id')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class ClassController {
  constructor(
    private readonly createClassUseCase: CreateClassUseCase,
    private readonly listSubjectClassesUseCase: ListSubjectClassesUseCase,
    private readonly listSubjectLecturersUseCase: ListSubjectLecturersUseCase,
    private readonly enrollByPasswordUseCase: EnrollByPasswordUseCase,
    private readonly unenrollClassUseCase: UnenrollClassUseCase,
    private readonly getMyClassUseCase: GetMyClassUseCase,
  ) {}

  @Post('classes')
  @RequirePermission('class:manage')
  @HttpCode(HttpStatus.CREATED)
  async createClass(
    @Param('id') subjectId: string,
    @Body() dto: CreateClassDto,
    @CurrentUser() user: User,
  ) {
    return this.createClassUseCase.execute(subjectId, dto, user.id);
  }

  @Get('classes')
  @RequirePermission('class:manage')
  async listClasses(@Param('id') subjectId: string, @CurrentUser() user: User) {
    return this.listSubjectClassesUseCase.execute(subjectId, user);
  }

  @Get('lecturers')
  @RequirePermission('subject:read')
  async listLecturers(@Param('id') subjectId: string) {
    return this.listSubjectLecturersUseCase.execute(subjectId);
  }

  @Get('my-class')
  @RequirePermission('subject:read')
  async myClass(@Param('id') subjectId: string, @CurrentUser() user: User) {
    return this.getMyClassUseCase.execute(subjectId, user.id);
  }

  @Post('enroll')
  @RequirePermission('subject:enroll')
  @HttpCode(HttpStatus.OK)
  async enroll(
    @Param('id') subjectId: string,
    @Body() dto: EnrollByPasswordDto,
    @CurrentUser() user: User,
  ) {
    await this.enrollByPasswordUseCase.execute(subjectId, dto, user.id);
    return { message: 'Enrolled successfully' };
  }

  @Delete('enroll')
  @RequirePermission('subject:enroll')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unenroll(@Param('id') subjectId: string, @CurrentUser() user: User) {
    await this.unenrollClassUseCase.execute(subjectId, user.id);
  }
}
