import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionGuard } from '../../guards/permission.guard';
import { RequirePermission } from '../../decorators/require-permission.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import {
  CreateStudentEmailAllowlistDto,
  BulkImportStudentEmailAllowlistDto,
  GetAllowlistQueryDto,
} from '../../../application/user/dtos/student-email-allowlist.dto';
import { StudentEmailAllowlistService } from '../../../application/user/services/student-email-allowlist.service';
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

@Controller('admin/student-email-allowlist')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@ApiTags('Admin Student Email Allowlist')
export class AdminStudentEmailAllowlistController {
  constructor(private readonly allowlistService: StudentEmailAllowlistService) {}

  @Get()
  @RequirePermission('user:manage')
    @ApiOperation({ summary: 'Get allowlist records' })
  async getAllowlistRecords(@Query() query: GetAllowlistQueryDto) {
    const { items, total } = await this.allowlistService.getAllowlistRecords(query);
    return {
      data: items,
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  @Post()
  @RequirePermission('user:manage')
    @ApiOperation({ summary: 'Create allowlist record' })
  async createAllowlistRecord(
    @Body() dto: CreateStudentEmailAllowlistDto,
    @CurrentUser() admin: any,
  ) {
    const record = await this.allowlistService.createAllowlistRecord(dto, admin.sub);
    return { message: 'Đã thêm email vào allowlist thành công', data: record };
  }

  @Post('bulk')
  @RequirePermission('user:manage')
    @ApiOperation({ summary: 'Bulk import allowlist' })
  async bulkImportAllowlist(
    @Body() dto: BulkImportStudentEmailAllowlistDto,
    @CurrentUser() admin: any,
  ) {
    const result = await this.allowlistService.bulkImportAllowlist(dto.records, admin.sub);
    return {
      message: 'Import hoàn tất',
      data: result,
    };
  }

  @Put(':id/disable')
  @RequirePermission('user:manage')
    @ApiOperation({ summary: 'Disable record' })
  async disableRecord(@Param('id') id: string) {
    await this.allowlistService.disableAllowlistRecord(id);
    return { message: 'Đã vô hiệu hóa record' };
  }

  @Put(':id/enable')
  @RequirePermission('user:manage')
    @ApiOperation({ summary: 'Enable record' })
  async enableRecord(@Param('id') id: string) {
    await this.allowlistService.enableAllowlistRecord(id);
    return { message: 'Đã bật lại record' };
  }
}
