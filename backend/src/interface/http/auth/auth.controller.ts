import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { LoginUseCase } from '../../../application/auth/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../../../application/auth/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../../../application/auth/use-cases/logout.use-case';
import { GetMeUseCase } from '../../../application/auth/use-cases/get-me.use-case';
import { LoginDto } from '../../../application/auth/dtos/login.dto';
import { RefreshTokenDto } from '../../../application/auth/dtos/refresh-token.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { AuditLogService } from '../../../application/system/services/audit-log.service';

@Controller('auth')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly getMeUseCase: GetMeUseCase,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    try {
      const result = await this.loginUseCase.execute(dto);
      await this.auditLogService.log(
        result.user.id,
        'USER_LOGIN',
        'user',
        result.user.id,
        { email: dto.email },
        req.ip,
      );
      return result;
    } catch (error) {
      await this.auditLogService.log(
        undefined,
        'USER_LOGIN_FAILED',
        'user',
        undefined,
        { email: dto.email },
        req.ip,
      );
      throw error;
    }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.refreshTokenUseCase.execute(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Body() dto: RefreshTokenDto) {
    await this.logoutUseCase.execute(dto.refreshToken);
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: any) {
    return this.getMeUseCase.execute(user.id);
  }
}
