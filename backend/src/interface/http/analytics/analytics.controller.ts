import { Controller, Get, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionGuard } from '../../guards/permission.guard';
import { RequirePermission } from '../../decorators/require-permission.decorator';
import { GetAdminStatsUseCase } from '../../../application/system/use-cases/get-admin-stats.use-case';
import { GetAiUsageUseCase } from '../../../application/system/use-cases/get-ai-usage.use-case';
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

@Controller('analytics')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@ApiTags('Analytics')
export class AnalyticsController {
  constructor(
    private readonly getAdminStatsUseCase: GetAdminStatsUseCase,
    private readonly getAiUsageUseCase: GetAiUsageUseCase,
  ) {}

  @Get('overview')
  @RequirePermission('analytics:read-all')
    @ApiOperation({ summary: 'Overview' })
  async overview() {
    return this.getAdminStatsUseCase.execute();
  }

  @Get('ai-usage')
  @RequirePermission('analytics:read-all')
    @ApiOperation({ summary: 'Ai usage' })
  async aiUsage() {
    return this.getAiUsageUseCase.execute();
  }
}
