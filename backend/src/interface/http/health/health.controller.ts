import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

@Controller('health')
@ApiTags('Health')
export class HealthController {
  @Get()
    @ApiOperation({ summary: 'Check' })
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
