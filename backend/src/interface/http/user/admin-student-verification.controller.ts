import { Controller, Get, Patch, Param, Body, UseGuards, UsePipes, ValidationPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { StudentVerificationService } from '../../../application/user/services/student-verification.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionGuard } from '../../guards/permission.guard';
import { RequirePermission } from '../../decorators/require-permission.decorator';
import { AdminReviewRequestDto } from '../../../application/user/dtos/admin-review-request.dto';
import { CurrentUser } from '../../decorators/current-user.decorator';

@Controller('admin/student-verifications')
@UseGuards(JwtAuthGuard, PermissionGuard)
@RequirePermission('user:manage')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class AdminStudentVerificationController {
  constructor(
    private readonly verificationService: StudentVerificationService,
  ) {}

  @Get()
  async getPendingRequests() {
    return this.verificationService.getPendingRequests();
  }

  @Get(':id')
  async getRequestDetail(@Param('id') id: string) {
    return this.verificationService.getRequestDetail(id);
  }

  @Patch(':id/approve')
  @HttpCode(HttpStatus.OK)
  async approveRequest(
    @Param('id') id: string,
    @CurrentUser() admin: any
  ) {
    return this.verificationService.approveRequest(id, admin.id);
  }

  @Patch(':id/reject')
  @HttpCode(HttpStatus.OK)
  async rejectRequest(
    @Param('id') id: string,
    @Body() dto: AdminReviewRequestDto,
    @CurrentUser() admin: any
  ) {
    return this.verificationService.rejectRequest(id, admin.id, dto.reason);
  }

  @Patch(':id/request-more-info')
  @HttpCode(HttpStatus.OK)
  async requestMoreInfo(
    @Param('id') id: string,
    @Body() dto: AdminReviewRequestDto,
    @CurrentUser() admin: any
  ) {
    return this.verificationService.requestMoreInfo(id, admin.id, dto.reason);
  }
}
