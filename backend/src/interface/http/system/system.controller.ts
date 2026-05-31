import {
  Controller,
  Get,
  Patch,
  Body,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionGuard } from '../../guards/permission.guard';
import { RequirePermission } from '../../decorators/require-permission.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { GetSettingsUseCase } from '../../../application/system/use-cases/get-settings.use-case';
import { UpdateSettingsUseCase } from '../../../application/system/use-cases/update-settings.use-case';
import { ListAuditLogsUseCase } from '../../../application/system/use-cases/list-audit-logs.use-case';
import { GetAdminStatsUseCase } from '../../../application/system/use-cases/get-admin-stats.use-case';
import { ListAuditLogsDto } from '../../../application/system/dtos/system.dto';
import { AuditLogService } from '../../../application/system/services/audit-log.service';

@Controller('system')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UsePipes(new ValidationPipe({ whitelist: false, transform: true }))
export class SystemController {
  constructor(
    private readonly getSettingsUseCase: GetSettingsUseCase,
    private readonly updateSettingsUseCase: UpdateSettingsUseCase,
    private readonly listAuditLogsUseCase: ListAuditLogsUseCase,
    private readonly getAdminStatsUseCase: GetAdminStatsUseCase,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get('settings')
  @RequirePermission('system:manage-settings')
  async getSettings() {
    return this.getSettingsUseCase.execute();
  }

  @Patch('settings')
  @RequirePermission('system:manage-settings')
  async updateSettings(
    @Body() updates: Record<string, unknown>,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const result = await this.updateSettingsUseCase.execute(updates, user.id);
    await this.auditLogService.log(
      user.id,
      'SETTINGS_UPDATED',
      'system',
      undefined,
      { updatedKeys: Object.keys(updates) },
      req.ip,
    );
    return result;
  }

  @Get('audit-logs')
  @RequirePermission('system:read-audit-log')
  async listAuditLogs(@Query() dto: ListAuditLogsDto) {
    return this.listAuditLogsUseCase.execute(dto);
  }

  @Get('stats')
  @RequirePermission('system:manage-settings')
  async getStats() {
    return this.getAdminStatsUseCase.execute();
  }
}
